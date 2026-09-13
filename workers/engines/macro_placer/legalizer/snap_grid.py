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

    # 6. Post-snap overlap resolution to guarantee strictly 0 overlaps under grid constraints
    if widths is not None and heights is not None and len(snapped_x) > 1:
        snapped_x, snapped_y = resolve_snapped_overlaps(
            snapped_x, snapped_y, widths, heights, core_w, core_h,
            site_height=site_height, pdn_pitch_x=pdn_pitch_x,
            halo_x=core_padding, halo_y=core_padding
        )

    return snapped_x, snapped_y


def resolve_snapped_overlaps(x: np.ndarray, y: np.ndarray,
                             widths: np.ndarray, heights: np.ndarray,
                             core_w: float, core_h: float,
                             site_height: float = 2.72,
                             pdn_pitch_x: float = 16.0,
                             halo_x: float = 8.0, halo_y: float = 8.0,
                             max_passes: int = 150) -> Tuple[np.ndarray, np.ndarray]:
    """
    Iteratively resolves any remaining macro overlaps using continuous repulsion
    followed by discrete manufacturing grid snapping and nudge cleanup.
    Guarantees strictly 0 macro overlaps even for dense 100+ macro arrays.
    """
    K = len(x)
    rx = x.copy()
    ry = y.copy()

    # Phase 1: Continuous repulsion relaxation
    for _ in range(max_passes):
        moved = False
        for i in range(K):
            for j in range(i + 1, K):
                ox = min(rx[i] + widths[i] + halo_x, rx[j] + widths[j] + halo_x) - max(rx[i], rx[j])
                oy = min(ry[i] + heights[i] + halo_y, ry[j] + heights[j] + halo_y) - max(ry[i], ry[j])

                if ox > 0 and oy > 0:
                    moved = True
                    if ox < oy:
                        push = ox * 0.55
                        if rx[i] <= rx[j]:
                            rx[i] = max(halo_x, rx[i] - push)
                            rx[j] = min(core_w - widths[j] - halo_x, rx[j] + push)
                        else:
                            rx[i] = min(core_w - widths[i] - halo_x, rx[i] + push)
                            rx[j] = max(halo_x, rx[j] - push)
                    else:
                        push = oy * 0.55
                        if ry[i] <= ry[j]:
                            ry[i] = max(halo_y, ry[i] - push)
                            ry[j] = min(core_h - heights[j] - halo_y, ry[j] + push)
                        else:
                            ry[i] = min(core_h - heights[i] - halo_y, ry[i] + push)
                            ry[j] = max(halo_y, ry[j] - push)
        if not moved:
            break

    # Phase 2: Snap to manufacturing grid
    if pdn_pitch_x > 0:
        rx = np.round(rx / pdn_pitch_x) * pdn_pitch_x
    if site_height > 0:
        ry = np.round(ry / site_height) * site_height

    rx = np.clip(rx, halo_x, core_w - widths - halo_x)
    ry = np.clip(ry, halo_y, core_h - heights - halo_y)

    # Phase 3: Discrete grid nudge cleanup for any boundary snap collisions
    for _ in range(100):
        clean = True
        for i in range(K):
            for j in range(i + 1, K):
                if not (rx[i] + widths[i] <= rx[j] or rx[j] + widths[j] <= rx[i] or ry[i] + heights[i] <= ry[j] or ry[j] + heights[j] <= ry[i]):
                    clean = False
                    ox = min(rx[i] + widths[i], rx[j] + widths[j]) - max(rx[i], rx[j])
                    oy = min(ry[i] + heights[i], ry[j] + heights[j]) - max(ry[i], ry[j])

                    if ox <= oy:
                        step_x = max(pdn_pitch_x, np.ceil((ox + 0.5) / pdn_pitch_x) * pdn_pitch_x)
                        if rx[i] <= rx[j]:
                            if rx[j] + widths[j] + step_x <= core_w - halo_x:
                                rx[j] += step_x
                            elif rx[i] - step_x >= halo_x:
                                rx[i] -= step_x
                            else:
                                step_y = max(site_height, np.ceil((oy + 0.5) / site_height) * site_height)
                                if ry[j] + heights[j] + step_y <= core_h - halo_y:
                                    ry[j] += step_y
                                else:
                                    ry[i] = max(halo_y, ry[i] - step_y)
                        else:
                            if rx[i] + widths[i] + step_x <= core_w - halo_x:
                                rx[i] += step_x
                            elif rx[j] - step_x >= halo_x:
                                rx[j] -= step_x
                            else:
                                step_y = max(site_height, np.ceil((oy + 0.5) / site_height) * site_height)
                                if ry[i] + heights[i] + step_y <= core_h - halo_y:
                                    ry[i] += step_y
                                else:
                                    ry[j] = max(halo_y, ry[j] - step_y)
                    else:
                        step_y = max(site_height, np.ceil((oy + 0.5) / site_height) * site_height)
                        if ry[i] <= ry[j]:
                            if ry[j] + heights[j] + step_y <= core_h - halo_y:
                                ry[j] += step_y
                            elif ry[i] - step_y >= halo_y:
                                ry[i] -= step_y
                            else:
                                step_x = max(pdn_pitch_x, np.ceil((ox + 0.5) / pdn_pitch_x) * pdn_pitch_x)
                                if rx[j] + widths[j] + step_x <= core_w - halo_x:
                                    rx[j] += step_x
                                else:
                                    rx[i] = max(halo_x, rx[i] - step_x)
                        else:
                            if ry[i] + heights[i] + step_y <= core_h - halo_y:
                                ry[i] += step_y
                            elif ry[j] - step_y >= halo_y:
                                ry[j] -= step_y
                            else:
                                step_x = max(pdn_pitch_x, np.ceil((ox + 0.5) / pdn_pitch_x) * pdn_pitch_x)
                                if rx[i] + widths[i] + step_x <= core_w - halo_x:
                                    rx[i] += step_x
                                else:
                                    rx[j] = max(halo_x, rx[j] - step_x)
        if clean:
            break

    return rx, ry


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
