"""
workers/engines/flow/state.py
Immutable, hermetic state snapshot for Ace-Seek's modular physical design pipeline.
Tracks design files, extracted telemetry, metrics, and execution history.
"""
from __future__ import annotations

import copy
import json
import os
from dataclasses import dataclass, field, asdict
from typing import Any, Optional


@dataclass(frozen=True)
class DesignState:
    """
    Immutable snapshot of the physical design state at any stage of implementation.
    Guarantees hermetic execution — steps produce new states without mutating previous states.
    """
    design_name: str
    pdk: str = "sky130A"
    step_id: str = "init"
    step_index: int = 0
    
    # Core design database file references
    rtl_files: tuple[str, ...] = field(default_factory=tuple)
    netlist: Optional[str] = None
    sdc_file: Optional[str] = None
    def_file: Optional[str] = None
    odb_file: Optional[str] = None
    spef_file: Optional[str] = None
    gds_file: Optional[str] = None
    
    # Physical metrics dictionary
    metrics: dict[str, Any] = field(default_factory=dict)
    
    # Generated artifacts and reports
    artifacts: tuple[str, ...] = field(default_factory=tuple)
    
    # Execution metadata & timing
    status: str = "initialized"  # "initialized" | "success" | "warning" | "failed"
    elapsed_seconds: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)

    def clone(self, **overrides: Any) -> DesignState:
        """
        Produce a new immutable DesignState with specified attribute modifications.
        Deep-copies mutable containers (metrics, metadata) to prevent side effects.
        """
        current_data = asdict(self)
        current_data["metrics"] = copy.deepcopy(self.metrics)
        current_data["metadata"] = copy.deepcopy(self.metadata)
        
        # Apply overrides
        for k, v in overrides.items():
            if k in ("rtl_files", "artifacts") and isinstance(v, (list, set)):
                current_data[k] = tuple(v)
            else:
                current_data[k] = v
                
        return DesignState(**current_data)

    def to_dict(self) -> dict[str, Any]:
        """Serialize state to standard JSON-compatible dictionary."""
        d = asdict(self)
        d["rtl_files"] = list(self.rtl_files)
        d["artifacts"] = list(self.artifacts)
        return d

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> DesignState:
        """Construct DesignState from dictionary."""
        d = dict(data)
        if "rtl_files" in d and isinstance(d["rtl_files"], list):
            d["rtl_files"] = tuple(d["rtl_files"])
        if "artifacts" in d and isinstance(d["artifacts"], list):
            d["artifacts"] = tuple(d["artifacts"])
        return cls(**d)

    def save(self, filepath: str) -> None:
        """Save state manifest to JSON file."""
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load(cls, filepath: str) -> DesignState:
        """Load state manifest from JSON file."""
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls.from_dict(data)
