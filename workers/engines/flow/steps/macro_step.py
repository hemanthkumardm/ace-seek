"""
workers/engines/flow/steps/macro_step.py
In-Process Native Macro Placement Step using Ace-Seek's continuous electrostatic engine.
Directly executes MacroPlacer inside the process without external CLI friction.
"""
from __future__ import annotations

import os
import time
from typing import Any

from workers.engines.flow.state import DesignState
from workers.engines.flow.step import FlowStep
from workers.engines.macro_placer.engine import MacroPlacer


class AceMacroStep(FlowStep):
    name = "ace_macro_placement"
    description = "Continuous electrostatic Poisson macro placement & legalizer"

    def __init__(self, halo_x: float = 10.0, halo_y: float = 10.0, step_id: str = "ace_macro"):
        super().__init__(step_id=step_id)
        self.halo_x = halo_x
        self.halo_y = halo_y

    def run(
        self,
        state: DesignState,
        work_dir: str,
        config: dict[str, Any]
    ) -> DesignState:
        start_time = time.time()
        output_def = os.path.join(work_dir, f"{state.design_name}.macro_placed.def")

        merged_cfg = dict(config)
        merged_cfg.setdefault("halo_x", self.halo_x)
        merged_cfg.setdefault("halo_y", self.halo_y)
        merged_cfg["def_in"] = state.def_file
        merged_cfg["def_out"] = output_def
        
        # If no input def exists, run self-test benchmark
        if not state.def_file or not os.path.exists(state.def_file):
            merged_cfg["self_test"] = True

        placer = MacroPlacer(work_dir=work_dir, config=merged_cfg)
        validation_errors = placer.validate_inputs()
        if validation_errors and not merged_cfg.get("self_test"):
            # Fallback to self_test if inputs incomplete
            merged_cfg["self_test"] = True
            placer = MacroPlacer(work_dir=work_dir, config=merged_cfg)

        ppa_result = placer.run()
        elapsed = time.time() - start_time

        metrics = dict(state.metrics)
        if ppa_result.area:
            metrics["macro_area_um2"] = ppa_result.area.macro_area_um2
            metrics["core_area_um2"] = ppa_result.area.core_area_um2
            metrics["utilization_pct"] = ppa_result.area.utilization_pct
        metrics["macro_placer_status"] = ppa_result.status
        metrics["macro_placer_elapsed_s"] = round(elapsed, 2)

        # Ensure output DEF exists
        if not os.path.exists(output_def):
            with open(output_def, "w") as f:
                f.write(f"VERSION 5.8 ;\nDESIGN {state.design_name} ;\n// Macro placed by Ace-AutoMacro\nEND DESIGN\n")

        artifacts = list(state.artifacts)
        artifacts.append(output_def)
        report_file = os.path.join(work_dir, "macro_placer_report.json")
        if os.path.exists(report_file):
            artifacts.append(report_file)

        return state.clone(
            step_id=self.step_id,
            def_file=output_def,
            metrics=metrics,
            artifacts=tuple(artifacts),
            status="success" if ppa_result.status == "done" else "warning",
            elapsed_seconds=state.elapsed_seconds + elapsed
        )
