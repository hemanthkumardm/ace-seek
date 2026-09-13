"""
Ace-Matrix: Pareto Frontier Engine
Extracts multi-objective non-dominated PPA (Power, Performance, Area) trade-off points.
"""

from typing import List, Dict, Any


def compute_pareto_frontier(candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Computes the Pareto Optimal frontier across multi-objective PPA metrics:
    - Maximize: Frequency (MHz), WNS (Slack ns)
    - Minimize: Total Power (mW), Core Area (um^2)
    
    A candidate A dominates B if:
      - freq_A >= freq_B
      - wns_A >= wns_B
      - power_A <= power_B
      - area_A <= area_B
      and at least one inequality is strict.
    """
    frontier: List[Dict[str, Any]] = []

    for i, a in enumerate(candidates):
        is_dominated = False
        for j, b in enumerate(candidates):
            if i == j:
                continue

            # Compare objectives
            b_freq_better = b.get("frequency_mhz", 0) >= a.get("frequency_mhz", 0)
            b_wns_better = b.get("wns_ns", -999) >= a.get("wns_ns", -999)
            b_pwr_better = b.get("total_power_mw", 999) <= a.get("total_power_mw", 999)
            b_area_better = b.get("area_um2", 9e9) <= a.get("area_um2", 9e9)

            b_strictly_better = (
                b.get("frequency_mhz", 0) > a.get("frequency_mhz", 0) or
                b.get("wns_ns", -999) > a.get("wns_ns", -999) or
                b.get("total_power_mw", 999) < a.get("total_power_mw", 999) or
                b.get("area_um2", 9e9) < a.get("area_um2", 9e9)
            )

            if b_freq_better and b_wns_better and b_pwr_better and b_area_better and b_strictly_better:
                is_dominated = True
                break

        if not is_dominated:
            frontier.append(a)

    return frontier
