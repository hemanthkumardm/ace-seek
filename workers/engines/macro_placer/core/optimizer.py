"""
Ace-AutoMacro: Continuous Optimization Loop
Coordinates Nesterov's Accelerated Gradient Descent over wirelength and electrostatics.
"""

from typing import List, Dict, Any, Tuple
import numpy as np

from .wirelength import weighted_average_wirelength, compute_hpwl
from .electrostatics import ElectrostaticEngine
from .inflation import InflationScheduler, compute_boundary_docking_forces


class NesterovPlacer:
    """
    Solves continuous placement using Nesterov accelerated gradient descent.
    """

    def __init__(self,
                 core_width: float,
                 core_height: float,
                 raw_widths: np.ndarray,
                 raw_heights: np.ndarray,
                 is_macro: np.ndarray,
                 pin_offsets_x: np.ndarray,
                 pin_offsets_y: np.ndarray,
                 net_pins: List[List[int]],
                 target_density: float = 0.70,
                 learning_rate: float = 0.50,
                 momentum: float = 0.90,
                 max_iters: int = 150):
        self.W = float(core_width)
        self.H = float(core_height)
        self.widths = np.asarray(raw_widths, dtype=float)
        self.heights = np.asarray(raw_heights, dtype=float)
        self.is_macro = np.asarray(is_macro, dtype=bool)
        self.pin_ox = np.asarray(pin_offsets_x, dtype=float)
        self.pin_oy = np.asarray(pin_offsets_y, dtype=float)
        self.net_pins = net_pins

        self.lr = float(learning_rate)
        self.momentum = float(momentum)
        self.max_iters = int(max_iters)

        self.electro = ElectrostaticEngine(self.W, self.H, num_bins_x=128, num_bins_y=128,
                                           target_density=target_density)
        self.scheduler = InflationScheduler(self.is_macro)

    def optimize(self, init_x: np.ndarray, init_y: np.ndarray,
                 lambda_density_init: float = 0.10,
                 beta_boundary: float = 0.05,
                 verbose: bool = True) -> Dict[str, Any]:
        """
        Runs continuous placement optimization loop.
        """
        N = len(init_x)
        # Position variables (lower-left coordinates)
        pos_x = init_x.astype(float).copy()
        pos_y = init_y.astype(float).copy()

        # Nesterov momentum state
        v_x = pos_x.copy()
        v_y = pos_y.copy()

        lambda_density = float(lambda_density_init)
        best_hpwl = float("inf")
        best_x = pos_x.copy()
        best_y = pos_y.copy()

        history = []

        for it in range(self.max_iters):
            # 1. Update effective dimensions with virtual bloating
            eff_w, eff_h = self.scheduler.get_effective_dimensions(self.widths, self.heights, it)

            # 2. Centers for wirelength calculation
            centers_x = pos_x + 0.5 * eff_w
            centers_y = pos_y + 0.5 * eff_h

            # 3. Wirelength gradient (WA model)
            wl_val, gw_x, gw_y = weighted_average_wirelength(
                centers_x, centers_y, self.pin_ox, self.pin_oy, self.net_pins, gamma=8.0
            )

            # 4. Electrostatic density field & forces
            density_grid = self.electro.project_density(pos_x, pos_y, eff_w, eff_h)
            energy, field_x, field_y = self.electro.solve(density_grid)
            f_density_x, f_density_y = self.electro.sample_forces(pos_x, pos_y, eff_w, eff_h, field_x, field_y)

            # 5. Boundary docking forces for macros
            gb_x, gb_y = compute_boundary_docking_forces(pos_x, pos_y, eff_w, eff_h, self.W, self.H,
                                                        self.is_macro, beta=beta_boundary)

            # 6. Normalize gradient magnitudes
            norm_wl = np.linalg.norm(gw_x) + np.linalg.norm(gw_y) + 1e-6
            norm_density = np.linalg.norm(f_density_x) + np.linalg.norm(f_density_y) + 1e-6

            # Balancing multiplier
            scale_density = (norm_wl / norm_density) * lambda_density

            # Total gradients: Minimize W + lambda * Density - Boundary
            # Note: Electric field E is repulsive, so adding it pushes blocks apart
            total_grad_x = gw_x - scale_density * f_density_x - gb_x
            total_grad_y = gw_y - scale_density * f_density_y - gb_y

            # 7. Nesterov momentum update
            step_size = self.lr / (1.0 + 0.01 * it)
            v_x_next = pos_x - step_size * total_grad_x
            v_y_next = pos_y - step_size * total_grad_y

            pos_x_next = (1.0 + self.momentum) * v_x_next - self.momentum * v_x
            pos_y_next = (1.0 + self.momentum) * v_y_next - self.momentum * v_y

            # 8. Boundary clamping
            pos_x = np.clip(pos_x_next, 0.0, self.W - self.widths)
            pos_y = np.clip(pos_y_next, 0.0, self.H - self.heights)
            v_x = v_x_next
            v_y = v_y_next

            # 9. Track metrics
            cur_hpwl = compute_hpwl(pos_x + 0.5 * self.widths, pos_y + 0.5 * self.heights,
                                    self.pin_ox, self.pin_oy, self.net_pins)
            max_density = float(np.max(density_grid))

            if cur_hpwl < best_hpwl and max_density <= 1.50:
                best_hpwl = cur_hpwl
                best_x = pos_x.copy()
                best_y = pos_y.copy()

            # Dynamic density weight ramp
            if max_density > 1.20:
                lambda_density = min(1.0, lambda_density * 1.05)
            else:
                lambda_density = max(0.05, lambda_density * 0.98)

            if verbose and (it % 25 == 0 or it == self.max_iters - 1):
                print(f"[Ace-AutoMacro] Iter {it:3d}/{self.max_iters}: HPWL={cur_hpwl:.1f} um | Peak Density={max_density:.2f} | lambda={lambda_density:.4f}")

            history.append({
                "iter": it,
                "hpwl": cur_hpwl,
                "peak_density": max_density,
                "energy": energy
            })

        return {
            "pos_x": best_x if best_hpwl < float("inf") else pos_x,
            "pos_y": best_y if best_hpwl < float("inf") else pos_y,
            "final_hpwl": best_hpwl if best_hpwl < float("inf") else cur_hpwl,
            "history": history
        }
