"""
workers/engines/flow/steps/eqy_step.py
Formal Logic Equivalence Checking (LEC) Step using EQY (YosysHQ).

Fail-closed by default: missing eqy or non-zero exit → status=failed.
Synthetic EQUIVALENT only when ACE_FLOW_MOCK=1 / config allow_mock=True.
"""
from __future__ import annotations

import os
import re
import time
from typing import Any, Literal

from workers.engines.flow.mock_mode import allow_mock
from workers.engines.flow.state import DesignState
from workers.engines.flow.step import FlowStep


# Valid EQY config: [gold]/[gate]/[strategy <name>] — no fake [options] mode keys.
# See https://yosyshq.readthedocs.io/projects/eqy/en/latest/config.html


class EqyLecStep(FlowStep):
    """
    Formal equivalence checking via EQY.
    Modes:
      rtl_vs_synth — golden RTL vs synthesized netlist
      synth_vs_layout — pre-layout netlist vs post-route netlist
    """

    name = "formal_equivalence_eqy"
    description = "Formal Logic Equivalence Checking (LEC) via EQY"

    def __init__(
        self,
        mode: Literal["rtl_vs_synth", "synth_vs_layout"] = "rtl_vs_synth",
        step_id: str | None = None,
        strategy: str = "sat",
        depth: int = 10,
    ):
        super().__init__(step_id=step_id or f"lec_{mode}")
        self.mode = mode
        self.strategy = strategy
        self.depth = depth

    def run(
        self,
        state: DesignState,
        work_dir: str,
        config: dict[str, Any],
    ) -> DesignState:
        start_time = time.time()
        script_file = os.path.join(work_dir, f"{state.design_name}_{self.mode}.eqy")
        log_file = f"eqy_{self.mode}.log"
        top = state.design_name
        mock = allow_mock(config)

        gold_lines = ["[gold]"]
        gate_lines = ["[gate]"]

        if self.mode == "rtl_vs_synth":
            for rtl in state.rtl_files:
                gold_lines.append(f"read_verilog -sv {rtl}")
            gold_lines.append(f"prep -top {top}")

            netlist = state.netlist or os.path.join(work_dir, f"synthesis_{top}.v")
            if "liberty_file" in config and os.path.exists(config["liberty_file"]):
                gate_lines.append(f"read_liberty -lib {config['liberty_file']}")
            gate_lines.append(f"read_verilog {netlist}")
            gate_lines.append(f"prep -top {top}")
        else:
            gold_net = state.netlist or os.path.join(work_dir, f"synthesis_{top}.v")
            gold_lines.append(f"read_verilog {gold_net}")
            gold_lines.append(f"prep -top {top}")

            routed_v = (
                config.get("routed_netlist")
                or os.path.join(work_dir, f"routing_{top}.nl.v")
            )
            if "liberty_file" in config and os.path.exists(config["liberty_file"]):
                gate_lines.append(f"read_liberty -lib {config['liberty_file']}")
            gate_lines.append(f"read_verilog {routed_v}")
            gate_lines.append(f"prep -top {top}")

        eqy_content = [
            f"# AceFlow EQY — {top} ({self.mode})",
            "# Valid EQY sections only: [gold], [gate], [strategy …]",
            "",
            *gold_lines,
            "",
            *gate_lines,
            "",
            f"[strategy {self.strategy}]",
            f"use {self.strategy}",
            f"depth {self.depth}",
            "",
        ]

        with open(script_file, "w", encoding="utf-8") as f:
            f.write("\n".join(eqy_content) + "\n")

        eqy_bin = config.get("eqy_bin", "eqy")
        exit_code, elapsed = self.run_command(
            [eqy_bin, script_file],
            work_dir=work_dir,
            log_file=log_file,
        )

        log_path = os.path.join(work_dir, log_file)
        proved_points = 0
        unmapped_points = 0
        is_equivalent = False
        status = "failed"
        note = ""

        if exit_code == 0 and os.path.exists(log_path) and os.path.getsize(log_path) > 0:
            with open(log_path, "r", encoding="utf-8", errors="ignore") as lf:
                content = lf.read()
            if re.search(r"NOT\s+EQUIVALENT|Counterexample\s+found|FAILED", content, re.I):
                is_equivalent = False
                status = "failed"
            elif re.search(
                r"Successfully proved equivalence|status:\s*EQUIVALENT|EQUIVALENT",
                content,
                re.I,
            ):
                is_equivalent = True
                status = "success"
            else:
                # Exit 0 but unrecognized log — treat as inconclusive warning
                status = "warning"
                note = "eqy_exit_0_unparsed"
            m = re.search(r"Proved\s+(\d+)\s+compare points", content, re.I)
            if m:
                proved_points = int(m.group(1))
            u = re.search(r"Unmapped points:\s*(\d+)", content, re.I)
            if u:
                unmapped_points = int(u.group(1))
        elif mock:
            proved_points = int(config.get("mock_compare_points", 148))
            is_equivalent = True
            status = "success"
            note = "mock_mode"
            with open(log_path, "a", encoding="utf-8") as lf:
                lf.write(
                    f"\n[ACE_FLOW_MOCK] Synthetic EQUIVALENT for {self.mode}\n"
                    f"Proved {proved_points} compare points\n"
                    f"Unmapped points: 0\n"
                    f"Status: EQUIVALENT (mock — not a real formal proof)\n"
                )
        else:
            note = "eqy_missing_or_failed"
            with open(log_path, "a", encoding="utf-8") as lf:
                lf.write(
                    "\n[AceFlow] EQY did not produce a valid equivalence proof.\n"
                    "Install YosysHQ EQY on PATH, or set ACE_FLOW_MOCK=1 for synthetic demos only.\n"
                    f"exit_code={exit_code}\n"
                )

        metrics = dict(state.metrics)
        metrics["lec_mode"] = self.mode
        metrics["lec_equivalent"] = is_equivalent
        metrics["lec_proved_points"] = proved_points
        metrics["lec_unmapped_points"] = unmapped_points
        metrics["lec_elapsed_s"] = round(
            elapsed if elapsed > 0 else (time.time() - start_time), 2
        )
        if note:
            metrics["lec_note"] = note

        artifacts = list(state.artifacts)
        artifacts.extend([script_file, log_path])

        return state.clone(
            step_id=self.step_id,
            metrics=metrics,
            artifacts=tuple(artifacts),
            status=status,
            elapsed_seconds=state.elapsed_seconds + (time.time() - start_time),
        )
