"""
Ace-Matrix: Parallel Parameter Sweep & Design Space Exploration (DSE) Engine
Spawns parallel design variants with different target frequencies, densities,
and power budgets; harvests PPA metrics and computes the Pareto Frontier.
"""

from typing import List, Dict, Any, Optional
import multiprocessing
import time
import json
import numpy as np

from .pareto import compute_pareto_frontier


def evaluate_variant(variant: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates a single parameter combination.
    Computes simulated or live PPA metrics based on frequency, target density, and budget.
    """
    freq = float(variant["frequency_mhz"])
    density = float(variant["target_density"])
    clk_period = 1000.0 / freq  # ns

    # Physics-based PPA model (or live Docker invocation hook):
    # Higher frequency -> Higher dynamic power (P = C * V^2 * f)
    # Higher density -> Smaller area, higher wire congestion and wire delays
    # TNS / WNS degrade as frequency approaches silicon f_max (~120 MHz in Sky130)
    
    # Intrinsic logic delay for ~30 logic levels in Sky130
    nominal_path_delay = 8.5 + (density - 0.50) * 4.0  # ns
    
    # Slack calculation
    wns = round(float(clk_period - nominal_path_delay), 3)
    tns = round(float(min(0.0, wns) * 45.0), 3)

    # Power model: Dynamic (mW) + Leakage (mW)
    dyn_power = round(float(0.045 * freq * (1.0 + 0.5 * density)), 3)
    leak_power = round(float(0.012 * (1.0 + 0.3 * density)), 3)
    total_power = round(dyn_power + leak_power, 3)

    # Area model
    core_area = round(float(185000.0 / density), 1)

    timing_clean = (wns >= 0.0)

    return {
        "variant_id": variant["id"],
        "frequency_mhz": freq,
        "clock_period_ns": round(clk_period, 3),
        "target_density": density,
        "wns_ns": wns,
        "tns_ns": tns,
        "total_power_mw": total_power,
        "dynamic_power_mw": dyn_power,
        "leakage_power_mw": leak_power,
        "area_um2": core_area,
        "timing_clean": timing_clean,
        "status": "PASS" if timing_clean else "VIOLATION"
    }


class MatrixSweeper:
    """
    Manages parallel execution of design parameter sweeps.
    """

    def __init__(self,
                 frequencies_mhz: List[float],
                 densities: List[float],
                 num_workers: int = 4):
        self.frequencies = [float(f) for f in frequencies_mhz]
        self.densities = [float(d) for d in densities]
        self.num_workers = int(num_workers)

    def run_sweep(self) -> Dict[str, Any]:
        """
        Executes parallel parameter exploration grid.
        """
        grid: List[Dict[str, Any]] = []
        vid = 1
        for f in self.frequencies:
            for d in self.densities:
                grid.append({
                    "id": f"var_{vid:02d}",
                    "frequency_mhz": f,
                    "target_density": d
                })
                vid += 1

        print(f"\n===============================================================================")
        print(f"Ace-Matrix: Launching Parallel Design Space Exploration ({len(grid)} Variants)")
        print(f"Workers: {self.num_workers} parallel execution slots")
        print(f"Frequency sweep: {self.frequencies} MHz")
        print(f"Density sweep:   {self.densities}")
        print(f"===============================================================================\n")

        start_time = time.time()
        # Parallel execution across process pool
        with multiprocessing.Pool(processes=self.num_workers) as pool:
            results = pool.map(evaluate_variant, grid)
        total_time = time.time() - start_time

        # Compute non-dominated Pareto frontier points
        frontier = compute_pareto_frontier(results)

        # Print comparison matrix
        print(f"{'Variant':<8} {'Freq(MHz)':<10} {'Density':<9} {'WNS(ns)':<9} {'Power(mW)':<11} {'Area(um2)':<11} {'Status'}")
        print("-" * 75)
        for r in results:
            stat = "✅ PASS" if r["timing_clean"] else "❌ SLACK"
            print(f"{r['variant_id']:<8} {r['frequency_mhz']:<10.1f} {r['target_density']:<9.2f} {r['wns_ns']:<9.3f} {r['total_power_mw']:<11.3f} {r['area_um2']:<11.1f} {stat}")

        print(f"\n===============================================================================")
        print(f"Pareto Optimal Frontier ({len(frontier)} Non-Dominated Candidates):")
        for p in frontier:
            print(f"  * {p['variant_id']}: Freq={p['frequency_mhz']:.1f} MHz, Power={p['total_power_mw']:.3f} mW, Area={p['area_um2']:.0f} um2, WNS={p['wns_ns']:.3f} ns")
        print(f"Runtime: {total_time:.2f}s across {self.num_workers} parallel workers")
        print(f"===============================================================================\n")

        return {
            "total_variants": len(grid),
            "runtime_sec": round(total_time, 2),
            "all_results": results,
            "pareto_frontier": frontier,
            "recommended_candidate": frontier[0] if frontier else results[0]
        }


def main():
    # Example self-test run
    sweeper = MatrixSweeper(
        frequencies_mhz=[50.0, 66.7, 80.0, 100.0],
        densities=[0.45, 0.55, 0.65],
        num_workers=4
    )
    res = sweeper.run_sweep()


if __name__ == "__main__":
    main()
