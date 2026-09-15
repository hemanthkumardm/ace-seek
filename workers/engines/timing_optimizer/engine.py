"""
Stub: TimingOptimizer is registered but not implemented.
Use AceFlow AceTimingEcoStep for script-only ECO candidates, or OpenSTA/OpenROAD for real slack.
"""
from __future__ import annotations

from typing import Any


class TimingOptimizer:
    """Placeholder so registry can report available=False cleanly if imported by mistake."""

    def __init__(self, work_dir: str, config: dict[str, Any]) -> None:
        raise NotImplementedError(
            "timing_optimizer is a stub — not installed. "
            "Use OpenLane/OpenSTA timing repair or AceFlow AceTimingEcoStep (script-only)."
        )

    def run(self) -> Any:
        raise NotImplementedError("timing_optimizer is a stub")
