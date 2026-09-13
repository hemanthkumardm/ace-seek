"""
workers/engines/base/metrics.py
Typed dataclasses for PPA metrics shared across all engines.
"""
from __future__ import annotations

import uuid
import datetime
from dataclasses import dataclass, field, asdict
from typing import Any


@dataclass
class TimingMetrics:
    wns: float = 0.0              # worst negative slack (ns)
    tns: float = 0.0              # total negative slack (ns)
    hold_wns: float = 0.0         # hold worst negative slack (ns)
    setup_violations: int = 0
    hold_violations: int = 0
    critical_path_ps: float = 0.0  # critical path length (ps)

    def is_clean(self) -> bool:
        return self.setup_violations == 0 and self.hold_violations == 0

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class PowerMetrics:
    total_mw: float = 0.0
    dynamic_mw: float = 0.0
    static_mw: float = 0.0
    switching_mw: float = 0.0

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class AreaMetrics:
    die_area_um2: float = 0.0
    core_area_um2: float = 0.0
    cell_area_um2: float = 0.0
    utilization_pct: float = 0.0
    macro_area_um2: float = 0.0

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class PPAResult:
    engine: str = ""
    run_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat() + "Z")
    elapsed_s: float = 0.0
    status: str = "idle"           # idle | done | error | partial
    timing: TimingMetrics | None = None
    power: PowerMetrics | None = None
    area: AreaMetrics | None = None
    config_snapshot: dict = field(default_factory=dict)
    log_path: str | None = None
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "engine": self.engine,
            "run_id": self.run_id,
            "timestamp": self.timestamp,
            "elapsed_s": self.elapsed_s,
            "status": self.status,
            "timing": self.timing.to_dict() if self.timing else None,
            "power": self.power.to_dict() if self.power else None,
            "area": self.area.to_dict() if self.area else None,
            "config_snapshot": self.config_snapshot,
            "log_path": self.log_path,
            "notes": self.notes,
        }

    @classmethod
    def from_dict(cls, d: dict) -> PPAResult:
        timing = TimingMetrics(**d["timing"]) if d.get("timing") else None
        power = PowerMetrics(**d["power"]) if d.get("power") else None
        area = AreaMetrics(**d["area"]) if d.get("area") else None
        return cls(
            engine=d.get("engine", ""),
            run_id=d.get("run_id", str(uuid.uuid4())),
            timestamp=d.get("timestamp", datetime.datetime.utcnow().isoformat() + "Z"),
            elapsed_s=d.get("elapsed_s", 0.0),
            status=d.get("status", "idle"),
            timing=timing,
            power=power,
            area=area,
            config_snapshot=d.get("config_snapshot", {}),
            log_path=d.get("log_path"),
            notes=d.get("notes", []),
        )

    def is_timing_clean(self) -> bool:
        return self.timing is not None and self.timing.is_clean()
