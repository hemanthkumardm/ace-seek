"""
Ace-AutoMacro: Manufacturing Grid & PDN Pitch Snapping
Enforces physical design guidelines:
1. Standard cell site row alignment (Row height multiple)
2. PDN vertical and horizontal power strap pitch alignment
3. Manufacturing grid resolution (0.005 um)
4. Anti-notch / dead-end channel prevention
"""

from typing import Tuple
import numpy as np


def snap_to_manufacturing_grid(pos_x: np.ndarray, pos_y: np.ndarray,
                               site_height: float = 2.72,
                               site_width: float = 0.46,
                               pdn_pitch_x: float = 16.0,
                               pdn_offset_x: float = 6.0,
                               mfg_grid: float = 0.005,
                               core_padding: float = 8.0,
                               core_w: float = 1000.0,
                               core_h: float = 1000.0,
                               widths: np.ndarray = None,
                               heights: np.ndarray = None) -> Tuple[np.ndarray, np.ndarray]:
    """
    Snaps macro positions to follow all foundry and EDA guidelines:
    - Y aligned to standard cell row boundaries (site_height).
    - X aligned to PDN vertical strap pitch for direct via dropping from power rings.
    - Fine coordinates snapped to manufacturing grid (0.005 um).
    - Clamped within core padding margins.
    """
    snapped_x = pos_x.copy()
    snapped_y = pos_y.copy()

    # 1. Apply core boundary inset padding
    if core_padding > 0.0:
        snapped_x = np.maximum(snapped_x, core_padding)
        snapped_y = np.maximum(snapped_y, core_padding)

    # 2. PDN Strap Pitch Alignment (Guideline: Macro edges align to VDD/VSS strap pitch)
    if pdn_pitch_x > 0.0:
        # Snap X to nearest PDN strap line
        snapped_x = np.round((snapped_x - pdn_offset_x) / pdn_pitch_x) * pdn_pitch_x + pdn_offset_x
        snapped_x = np.maximum(snapped_x, core_padding)

    # 3. Standard Cell Row Alignment (Guideline: Macro Y must be exact row multiple)
    if site_height > 0.0:
        snapped_y = np.round(snapped_y / site_height) * site_height

    # 4. Fine-grain manufacturing grid snapping (e.g. 0.005 um)
    snapped_x = np.round(snapped_x / mfg_grid) * mfg_grid
    snapped_y = np.round(snapped_y / mfg_grid) * mfg_grid

    # 5. Core upper boundary clamping
    if widths is not None and heights is not None:
        snapped_x = np.minimum(snapped_x, core_w - core_padding - widths)
        snapped_y = np.minimum(snapped_y, core_h - core_padding - heights)
        # Re-snap Y to site rows after clamping
        snapped_y = np.round(snapped_y / site_height) * site_height

    return snapped_x, snapped_y


def eliminate_narrow_notches(pos_x: np.ndarray, pos_y: np.ndarray,
                            widths: np.ndarray, heights: np.ndarray,
                            min_channel_width: float = 20.0) -> Tuple[np.ndarray, np.ndarray]:
    """
    Anti-Notch Guideline ("Channel of Death" Prevention):
    If the clearance between any two macros is between 0 and min_channel_width (e.g. 5-15 um),
    standard cells will get placed in this narrow corridor and cause fatal routing congestion.
    This function expands the channel to >= min_channel_width or abuts the macros.
    """
    K = len(pos_x)
    adj_x = pos_x.copy()
    adj_y = pos_y.copy()

    for i in range(K):
        for j in range(i + 1, K):
            # Check horizontal distance
            if not (adj_y[i] + heights[i] <= adj_y[j] or adj_y[j] + heights[j] <= adj_y[i]):
                # Overlap in Y: they face each other along X
                dist_x = max(adj_x[i], adj_x[j]) - min(adj_x[i] + widths[i], adj_x[j] + widths[j])
                if 0.0 < dist_x < min_channel_width:
                    # Narrow notch detected! Push them apart to min_channel_width
                    delta = min_channel_width - dist_x
                    if adj_x[i] < adj_x[j]:
                        adj_x[j] += delta
                    else:
                        adj_x[i] += delta

    return adj_x, adj_y
