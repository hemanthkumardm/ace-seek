"""
workers/engines/flow/flow.py
AceFlow Orchestrator: modular, sequential ASIC physical design flow runner.

Provides hermetic per-step directories, immutable DesignState checkpoints, and resume.
Stops on status=failed unless config continue_on_failure=True.
"""
from __future__ import annotations

import json
import os
import time
from typing import Any, Callable, Optional, Sequence

from workers.engines.flow.state import DesignState
from workers.engines.flow.step import FlowStep


class AceFlow:
    """
    Orchestrates sequential FlowStep execution with checkpoint isolation.
    """

    def __init__(
        self,
        name: str,
        steps: Sequence[FlowStep],
        work_dir: str,
        config: Optional[dict[str, Any]] = None,
    ):
        self.name = name
        self.steps = list(steps)
        self.work_dir = os.path.abspath(work_dir)
        self.config = config or {}
        self.history: list[dict[str, Any]] = []

    def run(
        self,
        initial_state: DesignState,
        resume_from: Optional[str | int] = None,
        on_step_complete: Optional[Callable[[DesignState, FlowStep], None]] = None,
    ) -> DesignState:
        """
        Executes flow steps in order.
        If resume_from is set, restores that step's checkpoint and continues after it.
        Aborts remaining steps when a step returns status=failed (unless continue_on_failure).
        """
        os.makedirs(self.work_dir, exist_ok=True)
        start_time = time.time()
        current_state = initial_state
        continue_on_failure = bool(self.config.get("continue_on_failure", False))

        resume_idx = 0
        if resume_from is not None:
            resume_idx = self._find_resume_index(resume_from)
            checkpoint_file = self._get_step_checkpoint(resume_idx)
            if os.path.exists(checkpoint_file):
                current_state = DesignState.load(checkpoint_file)
            resume_idx += 1

        for idx in range(resume_idx, len(self.steps)):
            step = self.steps[idx]
            step_dir = step.setup_work_dir(self.work_dir, idx)
            step_start = time.time()

            new_state = step.run(current_state, step_dir, self.config)
            step_elapsed = time.time() - step_start

            checkpoint_path = os.path.join(step_dir, "state.json")
            new_state.save(checkpoint_path)

            step_record = {
                "step_index": idx,
                "step_id": step.step_id,
                "name": step.name,
                "status": new_state.status,
                "elapsed_seconds": round(step_elapsed, 3),
                "checkpoint": checkpoint_path,
                "metrics": dict(new_state.metrics),
            }
            self.history.append(step_record)

            if on_step_complete:
                on_step_complete(new_state, step)

            current_state = new_state

            if new_state.status == "failed" and not continue_on_failure:
                break

        total_elapsed = time.time() - start_time
        summary_path = os.path.join(self.work_dir, "flow_summary.json")
        summary_data = {
            "flow_name": self.name,
            "design_name": current_state.design_name,
            "total_elapsed_seconds": round(total_elapsed, 3),
            "final_status": current_state.status,
            "final_metrics": current_state.metrics,
            "steps_executed": self.history,
            "artifacts": list(current_state.artifacts),
            "aborted_on_failure": current_state.status == "failed"
            and len(self.history) < len(self.steps)
            and not continue_on_failure,
        }
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary_data, f, indent=2)

        return current_state

    def _find_resume_index(self, resume_target: str | int) -> int:
        """Find step index by integer or step_id string."""
        if isinstance(resume_target, int):
            if 0 <= resume_target < len(self.steps):
                return resume_target
            raise ValueError(f"Resume index {resume_target} out of range [0, {len(self.steps)-1}]")
        for i, step in enumerate(self.steps):
            if step.step_id == resume_target:
                return i
        raise ValueError(f"Resume step_id '{resume_target}' not found in flow steps")

    def _get_step_checkpoint(self, step_index: int) -> str:
        """Locate checkpoint state.json for a step index."""
        step = self.steps[step_index]
        dir_name = f"{step_index:02d}_{step.step_id}"
        return os.path.join(self.work_dir, "steps", dir_name, "state.json")
