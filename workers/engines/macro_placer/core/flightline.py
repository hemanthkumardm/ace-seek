"""
Ace-AutoMacro: Flightline (Flyline) & Interconnect Analysis Engine
Computes:
1. Exact flightline segments between macro/cell pins and I/O pads
2. Macro-to-macro and macro-to-IO connectivity affinity matrix (C_ij)
3. Multi-bit bus detection and bundling
4. Spatial Routing Demand (RUDY) congestion heatmap from flightlines
5. Longest-path flightline anomaly detection (timing risk warnings)
"""

from typing import List, Dict, Tuple, Any, Optional
import numpy as np


class FlightlineAnalyzer:
    """
    Analyzes logical interconnect flylines across physical macro and cell placements.
    """

    def __init__(self, core_w: float, core_h: float):
        self.core_w = float(core_w)
        self.core_h = float(core_h)

    def analyze_flightlines(self,
                           pos_x: np.ndarray,
                           pos_y: np.ndarray,
                           widths: np.ndarray,
                           heights: np.ndarray,
                           pin_offsets_x: np.ndarray,
                           pin_offsets_y: np.ndarray,
                           net_pins: List[List[int]],
                           net_names: Optional[List[str]] = None,
                           instance_names: Optional[List[str]] = None,
                           is_macro: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """
        Extracts all flightlines, computes length distributions, detects buses,
        and identifies timing-critical long interconnects.
        """
        N = len(pos_x)
        if net_names is None:
            net_names = [f"net_{i}" for i in range(len(net_pins))]
        if instance_names is None:
            instance_names = [f"inst_{i}" for i in range(N)]
        if is_macro is None:
            is_macro = np.zeros(N, dtype=bool)

        # Compute pin absolute positions
        pin_abs_x = pos_x + 0.5 * widths + pin_offsets_x
        pin_abs_y = pos_y + 0.5 * heights + pin_offsets_y

        flightlines: List[Dict[str, Any]] = []
        net_lengths: List[float] = []
        macro_interconnect_lengths: List[float] = []

        # Connectivity affinity between instances: (inst_i, inst_j) -> count
        connectivity_pairs: Dict[Tuple[int, int], int] = {}

        for net_idx, pins in enumerate(net_pins):
            if len(pins) <= 1:
                continue

            p_arr = np.asarray(pins, dtype=int)
            xs = pin_abs_x[p_arr]
            ys = pin_abs_y[p_arr]

            # Star/clique flightline edges for analysis
            # Driver pin is p_arr[0], sinks are p_arr[1:]
            driver = p_arr[0]
            x_driver, y_driver = xs[0], ys[0]

            # Net HPWL
            hpwl = float((np.max(xs) - np.min(xs)) + (np.max(ys) - np.min(ys)))
            net_lengths.append(hpwl)

            has_macro = bool(np.any(is_macro[p_arr]))

            for sink_idx in range(1, len(p_arr)):
                sink = p_arr[sink_idx]
                x_sink, y_sink = xs[sink_idx], ys[sink_idx]

                # Euclidean flightline length
                dist = float(np.hypot(x_sink - x_driver, y_sink - y_driver))
                manhattan = float(abs(x_sink - x_driver) + abs(y_sink - y_driver))

                is_macro_flightline = bool(is_macro[driver] or is_macro[sink])
                if is_macro_flightline:
                    macro_interconnect_lengths.append(dist)

                # Record pair connectivity
                u, v = min(driver, sink), max(driver, sink)
                connectivity_pairs[(u, v)] = connectivity_pairs.get((u, v), 0) + 1

                flightlines.append({
                    "net": net_names[net_idx],
                    "driver_id": int(driver),
                    "driver_name": instance_names[driver],
                    "sink_id": int(sink),
                    "sink_name": instance_names[sink],
                    "start": [round(float(x_driver), 2), round(float(y_driver), 2)],
                    "end": [round(float(x_sink), 2), round(float(y_sink), 2)],
                    "euclidean_len_um": round(dist, 2),
                    "manhattan_len_um": round(manhattan, 2),
                    "is_macro_net": is_macro_flightline
                })

        # Sort flightlines by length to identify long-haul timing risks
        flightlines.sort(key=lambda item: item["euclidean_len_um"], reverse=True)

        # Detect Multi-Bit Bus Bundles (instances sharing >= 8 parallel nets)
        buses: List[Dict[str, Any]] = []
        for (u, v), wire_count in connectivity_pairs.items():
            if wire_count >= 8:
                buses.append({
                    "source": instance_names[u],
                    "target": instance_names[v],
                    "bus_width": wire_count,
                    "avg_distance_um": round(float(np.hypot(pos_x[u] - pos_x[v], pos_y[u] - pos_y[v])), 2)
                })

        buses.sort(key=lambda b: b["bus_width"], reverse=True)

        # Summary statistics
        total_hpwl = sum(net_lengths)
        macro_lengths = macro_interconnect_lengths if macro_interconnect_lengths else [0.0]

        summary = {
            "total_nets": len(net_pins),
            "total_flightlines": len(flightlines),
            "total_hpwl_um": round(total_hpwl, 2),
            "avg_flightline_um": round(float(np.mean(net_lengths)) if net_lengths else 0.0, 2),
            "max_flightline_um": round(float(np.max(net_lengths)) if net_lengths else 0.0, 2),
            "macro_flightlines_count": len(macro_interconnect_lengths),
            "macro_avg_flightline_um": round(float(np.mean(macro_lengths)), 2),
            "macro_max_flightline_um": round(float(np.max(macro_lengths)), 2),
            "detected_buses_count": len(buses),
            "buses": buses[:10],
            "top_longest_flightlines": flightlines[:15],
            "critical_long_wire_warnings": [
                f"Net '{fl['net']}' spans {fl['euclidean_len_um']} um between {fl['driver_name']} and {fl['sink_name']} (>50% die width)"
                for fl in flightlines if fl["euclidean_len_um"] > 0.50 * self.core_w
            ][:8]
        }

        return summary

    def compute_rudy_congestion(self,
                               pos_x: np.ndarray,
                               pos_y: np.ndarray,
                               widths: np.ndarray,
                               heights: np.ndarray,
                               net_pins: List[List[int]],
                               grid_bins: int = 64) -> np.ndarray:
        """
        Computes RUDY (Rectangular Uniform wire DensitY) routing congestion map.
        Projects bounding box routing demand of flightlines onto a 2D spatial grid.
        
        High RUDY values (>0.85) highlight routing congestion hotspots before detailed routing.
        """
        M = grid_bins
        N = grid_bins
        bin_w = self.core_w / N
        bin_h = self.core_h / M
        rudy_map = np.zeros((M, N), dtype=float)

        centers_x = pos_x + 0.5 * widths
        centers_y = pos_y + 0.5 * heights

        for pins in net_pins:
            if len(pins) <= 1:
                continue

            p_arr = np.asarray(pins, dtype=int)
            xs = centers_x[p_arr]
            ys = centers_y[p_arr]

            min_x, max_x = np.min(xs), np.max(xs)
            min_y, max_y = np.min(ys), np.max(ys)

            box_w = max(bin_w, max_x - min_x)
            box_h = max(bin_h, max_y - min_y)
            hpwl = box_w + box_h

            # Routing demand density per unit area
            demand = hpwl / (box_w * box_h)

            bx0 = max(0, min(N - 1, int(min_x / bin_w)))
            bx1 = max(0, min(N, int(np.ceil(max_x / bin_w))))
            by0 = max(0, min(M - 1, int(min_y / bin_h)))
            by1 = max(0, min(M, int(np.ceil(max_y / bin_h))))

            rudy_map[by0:by1, bx0:bx1] += demand * (bin_w * bin_h) / hpwl

        return rudy_map
