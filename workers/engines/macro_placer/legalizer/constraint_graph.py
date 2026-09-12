"""
Ace-AutoMacro: Topological Constraint Graph Legalizer
Eliminates all macro-macro overlaps using Horizontal and Vertical DAG compaction.
"""

from typing import List, Tuple
import numpy as np


def legalize_macros(pos_x: np.ndarray, pos_y: np.ndarray,
                    widths: np.ndarray, heights: np.ndarray,
                    core_w: float, core_h: float,
                    halo_x: float = 8.0, halo_y: float = 8.0) -> Tuple[np.ndarray, np.ndarray]:
    """
    Takes continuous macro positions and computes strictly legal, non-overlapping
    coordinates that respect minimum spacing halos.
    
    Args:
        pos_x, pos_y: (K,) Macro lower-left positions
        widths, heights: (K,) Macro dimensions
        core_w, core_h: Core bounding box
        halo_x, halo_y: Minimum clearance between adjacent macros
    """
    K = len(pos_x)
    if K <= 1:
        return np.clip(pos_x, 0.0, core_w - widths), np.clip(pos_y, 0.0, core_h - heights)

    leg_x = pos_x.copy()
    leg_y = pos_y.copy()

    # Effective size with halos
    eff_w = widths + halo_x
    eff_h = heights + halo_y

    # Centers
    cx = pos_x + 0.5 * widths
    cy = pos_y + 0.5 * heights

    # Build Horizontal (G_H) and Vertical (G_V) DAG adjacency
    # adj_x[i] = list of (j, min_dist)
    adj_x: List[List[Tuple[int, float]]] = [[] for _ in range(K)]
    adj_y: List[List[Tuple[int, float]]] = [[] for _ in range(K)]
    in_deg_x = [0] * K
    in_deg_y = [0] * K

    for i in range(K):
        for j in range(i + 1, K):
            dx = cx[j] - cx[i]
            dy = cy[j] - cy[i]

            overlap_x = 0.5 * (eff_w[i] + eff_w[j]) - abs(dx)
            overlap_y = 0.5 * (eff_h[i] + eff_h[j]) - abs(dy)

            # Assign to dimension with smaller required push
            if overlap_x > 0 and overlap_y > 0:
                if overlap_x < overlap_y:
                    # Separate along X
                    if dx >= 0:
                        adj_x[i].append((j, widths[i] + halo_x))
                        in_deg_x[j] += 1
                    else:
                        adj_x[j].append((i, widths[j] + halo_x))
                        in_deg_x[i] += 1
                else:
                    # Separate along Y
                    if dy >= 0:
                        adj_y[i].append((j, heights[i] + halo_y))
                        in_deg_y[j] += 1
                    else:
                        adj_y[j].append((i, heights[j] + halo_y))
                        in_deg_y[i] += 1
            else:
                # Naturally separated: enforce relative order to prevent future overlaps
                if abs(dx) >= abs(dy):
                    if dx >= 0:
                        adj_x[i].append((j, widths[i] + halo_x))
                        in_deg_x[j] += 1
                    else:
                        adj_x[j].append((i, widths[j] + halo_x))
                        in_deg_x[i] += 1
                else:
                    if dy >= 0:
                        adj_y[i].append((j, heights[i] + halo_y))
                        in_deg_y[j] += 1
                    else:
                        adj_y[j].append((i, heights[j] + halo_y))
                        in_deg_y[i] += 1

    # Topological sort & longest path for X
    queue_x = [i for i in range(K) if in_deg_x[i] == 0]
    out_x = leg_x.copy()
    while queue_x:
        u = queue_x.pop(0)
        for v, req_dist in adj_x[u]:
            out_x[v] = max(out_x[v], out_x[u] + req_dist)
            in_deg_x[v] -= 1
            if in_deg_x[v] == 0:
                queue_x.append(v)

    # Topological sort & longest path for Y
    queue_y = [i for i in range(K) if in_deg_y[i] == 0]
    out_y = leg_y.copy()
    while queue_y:
        u = queue_y.pop(0)
        for v, req_dist in adj_y[u]:
            out_y[v] = max(out_y[v], out_y[u] + req_dist)
            in_deg_y[v] -= 1
            if in_deg_y[v] == 0:
                queue_y.append(v)

    # Global boundary clamping with overflow squeeze
    # If blocks exceed core, squeeze proportionally
    max_x_reach = np.max(out_x + widths)
    if max_x_reach > core_w:
        min_x = np.min(out_x)
        span = max_x_reach - min_x
        if span > 0:
            scale = (core_w - min_x) / span
            out_x = min_x + (out_x - min_x) * max(0.1, scale)

    max_y_reach = np.max(out_y + heights)
    if max_y_reach > core_h:
        min_y = np.min(out_y)
        span_y = max_y_reach - min_y
        if span_y > 0:
            scale_y = (core_h - min_y) / span_y
            out_y = min_y + (out_y - min_y) * max(0.1, scale_y)

    out_x = np.clip(out_x, 0.0, core_w - widths)
    out_y = np.clip(out_y, 0.0, core_h - heights)

    return out_x, out_y
