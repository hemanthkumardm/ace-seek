"""
workers/engines/base/engine.py
Abstract base class for all OpenROAD engines.
"""
from __future__ import annotations

import abc
import json
import time
import uuid
from typing import Any

from .metrics import PPAResult


def _log(engine_name: str, level: str, msg: str, data: dict | None = None) -> None:
    """Emit a structured JSON log line to stdout."""
    record = {
        "ts": int(time.time() * 1000),
        "level": level,
        "engine": engine_name,
        "msg": msg,
        "data": data,
    }
    print(json.dumps(record), flush=True)


class BaseEngine(abc.ABC):
    """
    Abstract base class every OpenROAD engine must implement.

    Usage:
        class MyEngine(BaseEngine):
            def validate_inputs(self) -> list[str]: ...
            def run(self) -> PPAResult: ...
            def report(self) -> dict: ...
    """

    def __init__(self, work_dir: str, config: dict) -> None:
        self.work_dir = work_dir
        self.config = config
        self.status: str = "idle"          # idle | running | done | error
        self.elapsed_seconds: float = 0.0
        self.run_id: str = str(uuid.uuid4())
        self._result: PPAResult | None = None

    # ------------------------------------------------------------------ #
    # Abstract interface                                                    #
    # ------------------------------------------------------------------ #

    @abc.abstractmethod
    def validate_inputs(self) -> list[str]:
        """
        Return a list of human-readable error strings.
        Empty list means inputs are valid.
        """

    @abc.abstractmethod
    def _execute(self) -> PPAResult:
        """
        Core engine logic.  Called by run() after validation.
        Must return a PPAResult.
        """

    @abc.abstractmethod
    def report(self) -> dict:
        """
        Return a serialisable summary dict after run() completes.
        Called by the web API to populate the studio metrics cards.
        """

    # ------------------------------------------------------------------ #
    # Public run() — wraps _execute() with lifecycle management            #
    # ------------------------------------------------------------------ #

    def run(self) -> PPAResult:
        """
        Entry point called by registry / web API.
        Handles validation, timing, status, and structured logging.
        """
        name = self.__class__.__name__

        # Validate inputs first
        errors = self.validate_inputs()
        if errors:
            self.status = "error"
            self.log("error", "Validation failed", {"errors": errors})
            raise ValueError(f"[{name}] Input validation failed:\n" + "\n".join(f"  • {e}" for e in errors))

        self.status = "running"
        self.log("info", "Engine started", {"run_id": self.run_id, "work_dir": self.work_dir})

        t0 = time.perf_counter()
        try:
            result = self._execute()
            self.elapsed_seconds = time.perf_counter() - t0
            self.status = "done"
            self._result = result
            self.log("info", "Engine finished", {
                "run_id": self.run_id,
                "elapsed_s": round(self.elapsed_seconds, 3),
                "status": result.status,
            })
            return result

        except Exception as exc:
            self.elapsed_seconds = time.perf_counter() - t0
            self.status = "error"
            self.log("error", f"Engine raised exception: {exc}", {
                "run_id": self.run_id,
                "elapsed_s": round(self.elapsed_seconds, 3),
            })
            raise

    # ------------------------------------------------------------------ #
    # Helpers available to subclasses                                       #
    # ------------------------------------------------------------------ #

    def log(self, level: str, msg: str, data: dict | None = None) -> None:
        _log(self.__class__.__name__, level, msg, data)

    def base_result_kwargs(self) -> dict[str, Any]:
        """Shared fields every PPAResult needs — call from _execute()."""
        import datetime
        return {
            "engine": self.__class__.__name__,
            "run_id": self.run_id,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "elapsed_s": round(self.elapsed_seconds, 3),
            "config_snapshot": self.config,
        }
