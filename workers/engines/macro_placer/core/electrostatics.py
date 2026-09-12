"""
Ace-AutoMacro: Electrostatic Poisson Solver
Solves 2D Poisson Equation via 2D Discrete Cosine Transform (DCT)
to produce smooth, non-convex overlap repulsive forces.
"""

from typing import Tuple
import numpy as np


class ElectrostaticEngine:
    """
    Solves 2D Poisson Equation on an M x N grid:
        div^2 psi(x, y) = - (rho(x, y) - rho_target)
    Electric field:
        E = - grad(psi)
    Repulsive Force on block i:
        F_i = Area_i * E(p_i)
    """

    def __init__(self, core_width: float, core_height: float,
                 num_bins_x: int = 128, num_bins_y: int = 128,
                 target_density: float = 0.70):
        self.W = float(core_width)
        self.H = float(core_height)
        self.M = int(num_bins_y)  # Rows (Y)
        self.N = int(num_bins_x)  # Cols (X)
        self.target_density = float(target_density)

        self.bin_w = self.W / self.N
        self.bin_h = self.H / self.M
        self.bin_area = self.bin_w * self.bin_h

        # Precompute Orthonormal 1D DCT-II matrices for fast GEMM
        # C_N for columns (X), C_M for rows (Y)
        self.C_N = self._build_dct_matrix(self.N)
        self.C_M = self._build_dct_matrix(self.M)

        # Precompute spectral denominators 1 / (omega_u^2 + omega_v^2)
        u = np.arange(self.M)[:, None]
        v = np.arange(self.N)[None, :]
        
        # Spatial frequencies with Neumann boundary conditions
        omega_u = 2.0 * np.sin(u * np.pi / (2.0 * self.M)) / self.bin_h
        omega_v = 2.0 * np.sin(v * np.pi / (2.0 * self.N)) / self.bin_w
        
        denom = omega_u**2 + omega_v**2
        denom[0, 0] = 1.0  # Avoid division by zero at DC
        self.inv_laplacian = 1.0 / denom
        self.inv_laplacian[0, 0] = 0.0  # Zero DC component (neutral net charge)

    @staticmethod
    def _build_dct_matrix(size: int) -> np.ndarray:
        """Builds an orthonormal DCT-II matrix of given size."""
        n = np.arange(size)[None, :]
        k = np.arange(size)[:, None]
        mat = np.sqrt(2.0 / size) * np.cos((2.0 * n + 1.0) * k * np.pi / (2.0 * size))
        mat[0, :] /= np.sqrt(2.0)
        return mat

    def dct2(self, x: np.ndarray) -> np.ndarray:
        """2D Orthonormal DCT-II: C_M @ x @ C_N.T"""
        return self.C_M @ x @ self.C_N.T

    def idct2(self, X: np.ndarray) -> np.ndarray:
        """2D Orthonormal IDCT-II (DCT-III): C_M.T @ X @ C_N"""
        return self.C_M.T @ X @ self.C_N

    def project_density(self, pos_x: np.ndarray, pos_y: np.ndarray,
                        widths: np.ndarray, heights: np.ndarray) -> np.ndarray:
        """
        Projects cell & macro areas onto the 2D density grid using smooth
        area-fraction interpolation.
        
        pos_x, pos_y are lower-left coordinates.
        """
        density = np.zeros((self.M, self.N), dtype=float)
        
        # Clamp coordinates within core boundary
        x_min = np.clip(pos_x, 0.0, self.W)
        x_max = np.clip(pos_x + widths, 0.0, self.W)
        y_min = np.clip(pos_y, 0.0, self.H)
        y_max = np.clip(pos_y + heights, 0.0, self.H)

        # Convert to bin indices
        b_x_min = np.floor(x_min / self.bin_w).astype(int)
        b_x_max = np.ceil(x_max / self.bin_w).astype(int)
        b_y_min = np.floor(y_min / self.bin_h).astype(int)
        b_y_max = np.ceil(y_max / self.bin_h).astype(int)

        for i in range(len(pos_x)):
            x0, x1 = x_min[i], x_max[i]
            y0, y1 = y_min[i], y_max[i]
            if x1 <= x0 or y1 <= y0:
                continue

            bx0 = max(0, min(self.N - 1, b_x_min[i]))
            bx1 = max(0, min(self.N, b_x_max[i]))
            by0 = max(0, min(self.M - 1, b_y_min[i]))
            by1 = max(0, min(self.M, b_y_max[i]))

            for by in range(by0, by1):
                bin_y0 = by * self.bin_h
                bin_y1 = (by + 1) * self.bin_h
                ov_y = max(0.0, min(y1, bin_y1) - max(y0, bin_y0))
                if ov_y <= 0:
                    continue

                for bx in range(bx0, bx1):
                    bin_x0 = bx * self.bin_w
                    bin_x1 = (bx + 1) * self.bin_w
                    ov_x = max(0.0, min(x1, bin_x1) - max(x0, bin_x0))
                    if ov_x <= 0:
                        continue

                    # Accumulate area coverage normalized by bin area
                    density[by, bx] += (ov_x * ov_y) / self.bin_area

        return density

    def solve(self, density_grid: np.ndarray) -> Tuple[float, np.ndarray, np.ndarray]:
        """
        Solves Poisson equation for given density grid.
        
        Returns:
            energy: Electrostatic potential energy (scalar)
            field_x: Electric field in X (M, N)
            field_y: Electric field in Y (M, N)
        """
        # Target density adjustment
        mean_density = np.mean(density_grid)
        delta_rho = density_grid - self.target_density

        # Spectral domain
        rho_spectral = self.dct2(delta_rho)
        psi_spectral = rho_spectral * self.inv_laplacian
        
        # Spatial potential field
        psi = self.idct2(psi_spectral)

        # Electrostatic energy U = 0.5 * sum(delta_rho * psi)
        energy = 0.5 * np.sum(delta_rho * psi) * self.bin_area

        # Electric field E = -grad(psi)
        # Using central differences
        field_y = np.zeros_like(psi)
        field_x = np.zeros_like(psi)

        field_y[1:-1, :] = -(psi[2:, :] - psi[:-2, :]) / (2.0 * self.bin_h)
        field_y[0, :] = -(psi[1, :] - psi[0, :]) / self.bin_h
        field_y[-1, :] = -(psi[-1, :] - psi[-2, :]) / self.bin_h

        field_x[:, 1:-1] = -(psi[:, 2:] - psi[:, :-2]) / (2.0 * self.bin_w)
        field_x[:, 0] = -(psi[:, 1] - psi[:, 0]) / self.bin_w
        field_x[:, -1] = -(psi[:, -1] - psi[:, -2]) / self.bin_w

        return float(energy), field_x, field_y

    def sample_forces(self, pos_x: np.ndarray, pos_y: np.ndarray,
                      widths: np.ndarray, heights: np.ndarray,
                      field_x: np.ndarray, field_y: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Samples the electric field at block centers and computes repulsive force:
            F_x = Area_i * E_x(p_i)
            F_y = Area_i * E_y(p_i)
        """
        centers_x = pos_x + 0.5 * widths
        centers_y = pos_y + 0.5 * heights

        # Normalize to bin fractional coordinates
        gx = np.clip(centers_x / self.bin_w - 0.5, 0.0, self.N - 1.001)
        gy = np.clip(centers_y / self.bin_h - 0.5, 0.0, self.M - 1.001)

        ix = gx.astype(int)
        iy = gy.astype(int)
        fx = gx - ix
        fy = gy - iy

        # Bilinear interpolation of fields
        Ex = (1 - fx) * (1 - fy) * field_x[iy, ix] + \
             fx * (1 - fy) * field_x[iy, ix + 1] + \
             (1 - fx) * fy * field_x[iy + 1, ix] + \
             fx * fy * field_x[iy + 1, ix + 1]

        Ey = (1 - fx) * (1 - fy) * field_y[iy, ix] + \
             fx * (1 - fy) * field_y[iy, ix + 1] + \
             (1 - fx) * fy * field_y[iy + 1, ix] + \
             fx * fy * field_y[iy + 1, ix + 1]

        areas = widths * heights
        force_x = areas * Ex
        force_y = areas * Ey

        return force_x, force_y
