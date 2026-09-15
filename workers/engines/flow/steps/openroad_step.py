"""
workers/engines/flow/steps/openroad_step.py
Modular OpenROAD Physical Design Step.

Fail-closed: missing openroad or missing ODB/DEF → status=failed unless ACE_FLOW_MOCK=1.
"""
from __future__ import annotations

import os
import re
from typing import Any, Optional

from workers.engines.flow.mock_mode import allow_mock
from workers.engines.flow.state import DesignState
from workers.engines.flow.step import FlowStep


class OpenROADStep(FlowStep):
    """
    Executes an OpenROAD stage using native Tcl scripting.
    Supports floorplan, global/detail placement, CTS, and routing.
    """

    def __init__(
        self,
        stage_name: str,
        tcl_commands: Optional[list[str]] = None,
        step_id: Optional[str] = None,
    ):
        super().__init__(step_id=step_id or f"openroad_{stage_name}")
        self.stage_name = stage_name
        self.tcl_commands = tcl_commands or []
        self.name = f"openroad_{stage_name}"
        self.description = f"OpenROAD stage: {stage_name}"

    def run(
        self,
        state: DesignState,
        work_dir: str,
        config: dict[str, Any],
    ) -> DesignState:
        script_file = os.path.join(work_dir, f"{self.stage_name}.tcl")
        log_file = f"{self.stage_name}.log"
        output_odb = os.path.join(work_dir, f"{state.design_name}_{self.stage_name}.odb")
        output_def = os.path.join(work_dir, f"{state.design_name}_{self.stage_name}.def")
        mock = allow_mock(config)

        tcl_lines = [f"# Auto-generated OpenROAD Tcl for stage: {self.stage_name}"]

        if state.odb_file and os.path.exists(state.odb_file):
            tcl_lines.append(f"read_db {state.odb_file}")
        elif state.def_file and os.path.exists(state.def_file):
            if "lef_files" in config:
                for lef in config["lef_files"]:
                    tcl_lines.append(f"read_lef {lef}")
            tcl_lines.append(f"read_def {state.def_file}")
        elif state.netlist and os.path.exists(state.netlist):
            if "lef_files" in config:
                for lef in config["lef_files"]:
                    tcl_lines.append(f"read_lef {lef}")
            tcl_lines.append(f"read_verilog {state.netlist}")
            tcl_lines.append(f"link_design {state.design_name}")

        sdc = state.sdc_file or config.get("sdc_file")
        if sdc and os.path.exists(sdc):
            tcl_lines.append(f"read_sdc {sdc}")

        tcl_lines.extend(self.tcl_commands)
        tcl_lines.append(f"write_db {output_odb}")
        tcl_lines.append(f"write_def {output_def}")
        tcl_lines.append("exit")

        with open(script_file, "w", encoding="utf-8") as f:
            f.write("\n".join(tcl_lines) + "\n")

        openroad_bin = config.get("openroad_bin", "openroad")
        exit_code, elapsed = self.run_command(
            [openroad_bin, "-exit", script_file],
            work_dir=work_dir,
            log_file=log_file,
        )

        metrics = dict(state.metrics)
        log_path = os.path.join(work_dir, log_file)
        if os.path.exists(log_path):
            with open(log_path, "r", encoding="utf-8", errors="ignore") as lf:
                content = lf.read()
                wns_m = re.search(r"worst slack\s+([-\d\.]+)", content, re.IGNORECASE)
                if wns_m:
                    metrics["wns"] = float(wns_m.group(1))
                tns_m = re.search(r"total slack\s+([-\d\.]+)", content, re.IGNORECASE)
                if tns_m:
                    metrics["tns"] = float(tns_m.group(1))
                util_m = re.search(r"utilization\s+:\s+([\d\.]+)", content, re.IGNORECASE)
                if util_m:
                    metrics["utilization"] = float(util_m.group(1))

        produced = os.path.exists(output_odb) or os.path.exists(output_def)
        status = "success" if exit_code == 0 and produced else "failed"

        if not produced:
            if mock:
                with open(output_odb, "wb") as f:
                    f.write(b"ODBV2.0_MOCK")
                with open(output_def, "w", encoding="utf-8") as f:
                    f.write(
                        f"VERSION 5.8 ;\nDESIGN {state.design_name} ;\n"
                        f"# ACE_FLOW_MOCK placeholder DEF\nEND DESIGN\n"
                    )
                status = "success"
                metrics["openroad_note"] = "mock_mode"
            else:
                with open(log_path, "a", encoding="utf-8") as lf:
                    lf.write(
                        "\n[AceFlow] OpenROAD did not produce ODB/DEF. "
                        "Install openroad on PATH or set ACE_FLOW_MOCK=1 for demos.\n"
                    )

        artifacts = list(state.artifacts)
        artifacts.extend([script_file, log_path])
        if os.path.exists(output_odb):
            artifacts.append(output_odb)
        if os.path.exists(output_def):
            artifacts.append(output_def)

        return state.clone(
            step_id=self.step_id,
            odb_file=output_odb if os.path.exists(output_odb) else state.odb_file,
            def_file=output_def if os.path.exists(output_def) else state.def_file,
            metrics=metrics,
            artifacts=tuple(artifacts),
            status=status,
            elapsed_seconds=state.elapsed_seconds + elapsed,
        )
