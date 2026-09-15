"""
Stub: CongestionResolver is registered but not implemented.
Flightline/RUDY analysis lives inside Ace-AutoMacro (macro_placer) for now.
"""
from __future__ import annotations

from typing import Any


class CongestionResolver:
    def __init__(self, work_dir: str, config: dict[str, Any]) -> None:
        raise NotImplementedError(
            "congestion_resolver is a stub — not installed. "
            "RUDY/flightline analysis is available inside Ace-AutoMacro (macro_placer)."
        )

    def run(self) -> Any:
        raise NotImplementedError("congestion_resolver is a stub")
