"""
workers/engines/flow/step.py
Base abstraction for modular, hermetic execution steps in Ace-Seek.
Provides execution sandboxing, metric extraction, and immutable state transitions.
Clean-room implementation designed for maximum speed and zero external bloat.
"""
from __future__ import annotations

import os
import time
import subprocess
from abc import ABC, abstractmethod
from typing import Any, Optional

from workers.engines.flow.state import DesignState


class FlowStep(ABC):
    """
    Abstract Base Class for an atomic physical design step.
    Each step:
      1. Receives an immutable input DesignState and a configuration dict.
      2. Executes inside an isolated, hermetic working directory.
      3. Produces a new immutable DesignState with updated file pointers, metrics, and logs.
    """
    name: str = "base_step"
    description: str = "Base execution step"

    def __init__(self, step_id: Optional[str] = None):
        self.step_id = step_id or self.name

    def setup_work_dir(self, base_run_dir: str, step_index: int) -> str:
        """Create a dedicated, isolated step working directory."""
        dir_name = f"{step_index:02d}_{self.step_id}"
        work_dir = os.path.join(base_run_dir, "steps", dir_name)
        os.makedirs(work_dir, exist_ok=True)
        return work_dir

    def run_command(
        self,
        cmd: list[str] | str,
        work_dir: str,
        log_file: str,
        env: Optional[dict[str, str]] = None
    ) -> tuple[int, float]:
        """
        Executes an external tool subprocess with output streamed into log_file.
        Returns (exit_code, elapsed_seconds).
        """
        merged_env = os.environ.copy()
        if env:
            merged_env.update(env)

        start_time = time.time()
        log_path = os.path.join(work_dir, log_file)

        is_shell = isinstance(cmd, str)
        with open(log_path, "w", encoding="utf-8") as lf:
            proc = subprocess.Popen(
                cmd,
                cwd=work_dir,
                env=merged_env,
                shell=is_shell,
                stdout=lf,
                stderr=subprocess.STDOUT
            )
            exit_code = proc.wait()

        elapsed = time.time() - start_time
        return exit_code, elapsed

    @abstractmethod
    def run(
        self,
        state: DesignState,
        work_dir: str,
        config: dict[str, Any]
    ) -> DesignState:
        """
        Execute the step logic. Must return a newly cloned DesignState.
        DO NOT mutate the input state.
        """
        pass
