"""
workers/engines/ppa_optimizer/engine.py
PPAOptimizer Engine implementing BaseEngine.
Executes grid-sweep parameter exploration and Pareto frontier optimization.
"""
from __future__ import annotations

import os
from typing import Any

from workers.engines.base import (
    BaseEngine,
    PPAResult,
    TimingMetrics,
    PowerMetrics,
    AreaMetrics,
)
from workers.engines.matrix_sweeper.sweeper import MatrixSweeper


class PPAOptimizer(BaseEngine):
    """
    Grid-sweep PPA optimizer exploring frequency, target density, and power trade-offs
    to calculate the Pareto-optimal frontier.
    """

    def __init__(self, work_dir: str, config: dict) -> None:
        super().__init__(work_dir, config)
        self._report_data: dict[str, Any] = {}

    def validate_inputs(self) -> list[str]:
        errors: list[str] = []
        freqs = self.config.get("frequency_sweep", [50.0, 100.0])
        densities = self.config.get("density_sweep", [0.5, 0.65])

        if not isinstance(freqs, list) or not freqs:
            errors.append("frequency_sweep must be a non-empty list of frequencies in MHz")
        elif any(float(f) <= 0 for f in freqs):
            errors.append("All frequency_sweep values must be greater than 0 MHz")

        if not isinstance(densities, list) or not densities:
            errors.append("density_sweep must be a non-empty list of target densities")
        elif any(float(d) <= 0.0 or float(d) >= 1.0 for d in densities):
            errors.append("All density_sweep values must be between 0.0 and 1.0")

        return errors

    def _execute(self) -> PPAResult:
        freqs = [float(f) for f in self.config.get("frequency_sweep", [50.0, 100.0])]
        densities = [float(d) for d in self.config.get("density_sweep", [0.5, 0.65])]
        max_workers = int(self.config.get("max_workers", 2))

        self.log("info", "Starting PPAOptimizer parameter sweep", {
            "frequencies": freqs,
            "densities": densities,
            "max_workers": max_workers,
        })

        sweeper = MatrixSweeper(
            frequencies_mhz=freqs,
            densities=densities,
            num_workers=max_workers,
        )
        sweep_res = sweeper.run_sweep()

        results = sweep_res.get("all_results", [])
        pareto_front = sweep_res.get("pareto_frontier", [])
        recommended = sweep_res.get("recommended_candidate", {})

        timing_metrics = TimingMetrics(
            wns=float(recommended.get("wns_ns", 0.0)),
            tns=float(recommended.get("tns_ns", 0.0)),
            hold_wns=0.05,
            setup_violations=0 if recommended.get("timing_clean") else 1,
            critical_path_ps=float(recommended.get("clock_period_ns", 10.0) * 1000.0),
        )
        power_metrics = PowerMetrics(
            total_mw=float(recommended.get("total_power_mw", 0.0)),
            dynamic_mw=float(recommended.get("dynamic_power_mw", 0.0)),
            static_mw=float(recommended.get("leakage_power_mw", 0.0)),
        )
        area_metrics = AreaMetrics(
            core_area_um2=float(recommended.get("area_um2", 0.0)),
            die_area_um2=float(recommended.get("area_um2", 0.0) * 1.15),
            utilization_pct=float(recommended.get("target_density", 0.5) * 100.0),
        )

        status = "done" if results else "error"
        self._report_data = {
            "total_variants": len(results),
            "pareto_candidates": len(pareto_front),
            "recommended_variant": recommended.get("variant_id"),
            "pareto_frontier": pareto_front,
            "status": status,
        }

        return PPAResult(
            engine=self.__class__.__name__,
            run_id=self.run_id,
            status=status,
            timing=timing_metrics,
            power=power_metrics,
            area=area_metrics,
            config_snapshot=dict(self.config),
            log_path=os.path.join(self.work_dir, "ppa_optimizer.log"),
            notes=[
                f"Evaluated {len(results)} parameter combinations",
                f"Identified {len(pareto_front)} non-dominated Pareto frontier candidates",
            ],
        )

    def report(self) -> dict[str, Any]:
        return dict(self._report_data)
