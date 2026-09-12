"""
Ace-AutoMacro: Dynamic Macro Inflation & Boundary Guiding
Schedules virtual bloating of macros to carve routing channels and enforces boundary docking.
"""

from typing import Tuple
import numpy as np


class InflationScheduler:
    """
    Manages dynamic inflation of macros during continuous optimization.
    
    Early iterations: Large virtual halos push standard cells and other macros away,
    preventing overlap hotspots.
    Late iterations: Halos decay to the target manufacturing clearance (halo_min).
    """

    def __init__(self, is_macro: np.ndarray,
                 halo_min_x: float = 8.0, halo_min_y: float = 8.0,
                 virtual_ratio_init: float = 0.50, decay_rate: float = 0.02):
        """
        Args:
            is_macro: boolean array (True for macro, False for standard cell)
            halo_min_x: Minimum physical halo in X (microns)
            halo_min_y: Minimum physical halo in Y (microns)
            virtual_ratio_init: Initial extra inflation ratio relative to macro dimensions
            decay_rate: Exponential decay rate per iteration
        """
        self.is_macro = np.asarray(is_macro, dtype=bool)
        self.halo_min_x = float(halo_min_x)
        self.halo_min_y = float(halo_min_y)
        self.virtual_ratio_init = float(virtual_ratio_init)
        self.decay_rate = float(decay_rate)

    def get_effective_dimensions(self, raw_widths: np.ndarray, raw_heights: np.ndarray,
                                iteration: int) -> Tuple[np.ndarray, np.ndarray]:
        """
        Returns inflated widths and heights for iteration t.
        """
        factor = self.virtual_ratio_init * np.exp(-self.decay_rate * float(iteration))
        
        eff_w = raw_widths.copy()
        eff_h = raw_heights.copy()

        # Apply inflation only to macros
        macro_idx = np.where(self.is_macro)[0]
        if len(macro_idx) > 0:
            eff_w[macro_idx] += 2.0 * (self.halo_min_x + raw_widths[macro_idx] * factor)
            eff_h[macro_idx] += 2.0 * (self.halo_min_y + raw_heights[macro_idx] * factor)

        return eff_w, eff_h


def compute_boundary_docking_forces(pos_x: np.ndarray, pos_y: np.ndarray,
                                   widths: np.ndarray, heights: np.ndarray,
                                   core_w: float, core_h: float,
                                   is_macro: np.ndarray,
                                   beta: float = 0.10) -> Tuple[np.ndarray, np.ndarray]:
    """
    Computes gentle attraction forces pulling macros toward the closest core boundary (North, South, East, West).
    Leaves the center of the chip open for high-density standard-cell routing corridors.
    """
    grad_x = np.zeros_like(pos_x)
    grad_y = np.zeros_like(pos_y)

    macro_idx = np.where(is_macro)[0]
    if len(macro_idx) == 0 or beta <= 0.0:
        return grad_x, grad_y

    for idx in macro_idx:
        x = pos_x[idx]
        y = pos_y[idx]
        w = widths[idx]
        h = heights[idx]

        # Distances to each of the 4 borders
        dist_west = x
        dist_east = core_w - (x + w)
        dist_south = y
        dist_north = core_h - (y + h)

        # Pull towards closest horizontal edge
        if dist_west < dist_east:
            # Pull left (negative x force)
            fx = -2.0 * beta * max(0.0, dist_west)
        else:
            # Pull right (positive x force)
            fx = 2.0 * beta * max(0.0, dist_east)

        # Pull towards closest vertical edge
        if dist_south < dist_north:
            # Pull down
            fy = -2.0 * beta * max(0.0, dist_south)
        else:
            # Pull up
            fy = 2.0 * beta * max(0.0, dist_north)

        grad_x[idx] = fx
        grad_y[idx] = fy

    return grad_x, grad_y
