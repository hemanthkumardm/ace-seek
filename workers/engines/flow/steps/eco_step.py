"""
workers/engines/flow/steps/eco_step.py
Timing ECO *script generator* (not a live STA engine).

Generates candidate OpenROAD-style ECO Tcl from reported WNS/TNS metrics.
Does NOT claim real slack recovery unless ACE_FLOW_MOCK=1 updates metrics for demos.
"""
from __future__ import annotations

import os
import time
from typing import Any

from workers.engines.flow.mock_mode import allow_mock
from workers.engines.flow.state import DesignState
from workers.engines.flow.step import FlowStep


class AceTimingEcoStep(FlowStep):
    name = "ace_timing_eco"
    description = "Generate candidate timing ECO Tcl from reported WNS/TNS (not live STA)"

    def __init__(self, target_slack_ns: float = 0.0, step_id: str = "ace_timing_eco"):
        super().__init__(step_id=step_id)
        self.target_slack_ns = target_slack_ns

    def run(
        self,
        state: DesignState,
        work_dir: str,
        config: dict[str, Any],
    ) -> DesignState:
        start_time = time.time()
        eco_tcl = os.path.join(work_dir, "timing_eco.tcl")
        mock = allow_mock(config)

        current_wns = float(state.metrics.get("wns", 0.0))
        current_tns = float(state.metrics.get("tns", 0.0))

        repaired_buffers = 0
        eco_cmds = [
            f"# AceTimingEco candidate script for {state.design_name}",
            f"# Input metrics (from prior stage reports): WNS={current_wns} ns, TNS={current_tns} ns",
            "# NOTE: This step writes candidate Tcl only. Re-run OpenSTA/OpenROAD to measure real slack.",
        ]

        new_wns = current_wns
        new_tns = current_tns
        if current_wns < self.target_slack_ns:
            deficit = abs(current_wns - self.target_slack_ns)
            repaired_buffers = max(1, int(deficit / 0.15))
            for i in range(repaired_buffers):
                eco_cmds.append(
                    f"# candidate: insert_buffer -net net_crit_{i} -cell sky130_fd_sc_hd__buf_4"
                )
                eco_cmds.append(
                    f"# candidate: size_cell -instance inst_crit_{i} -cell sky130_fd_sc_hd__inv_4"
                )
            if mock:
                recovered_slack = min(deficit, repaired_buffers * 0.18)
                new_wns = round(current_wns + recovered_slack, 3)
                new_tns = round(min(0.0, current_tns + (recovered_slack * repaired_buffers)), 3)
                eco_cmds.append(
                    f"# ACE_FLOW_MOCK: simulated WNS {current_wns} → {new_wns} (not measured)"
                )
            else:
                eco_cmds.append(
                    "# Metrics unchanged — apply this Tcl in OpenROAD then re-report_checks."
                )
        else:
            eco_cmds.append("# Timing target already met in reported metrics; no ECO candidates.")

        with open(eco_tcl, "w", encoding="utf-8") as f:
            f.write("\n".join(eco_cmds) + "\n")

        elapsed = time.time() - start_time
        metrics = dict(state.metrics)
        metrics["wns"] = new_wns
        metrics["tns"] = new_tns
        metrics["eco_buffers_inserted"] = repaired_buffers
        metrics["eco_elapsed_s"] = round(elapsed, 2)
        metrics["eco_mode"] = "mock_simulated" if mock and repaired_buffers else "script_only"

        artifacts = list(state.artifacts)
        artifacts.append(eco_tcl)

        return state.clone(
            step_id=self.step_id,
            metrics=metrics,
            artifacts=tuple(artifacts),
            status="success",
            elapsed_seconds=state.elapsed_seconds + elapsed,
        )
