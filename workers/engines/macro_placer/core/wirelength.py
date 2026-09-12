"""
Ace-AutoMacro: Differentiable Wirelength Kernels
Implements Weighted-Average (WA) wirelength approximation and analytical gradients.
"""

from typing import List, Tuple
import numpy as np


def compute_hpwl(pos_x: np.ndarray, pos_y: np.ndarray,
                 pin_offsets_x: np.ndarray, pin_offsets_y: np.ndarray,
                 net_pins: List[List[int]]) -> float:
    """
    Computes exact Half-Perimeter Wirelength (HPWL).
    
    Args:
        pos_x: (N,) x-coordinates of cell/macro centers
        pos_y: (N,) y-coordinates of cell/macro centers
        pin_offsets_x: (P,) x-offsets of pins from parent center
        pin_offsets_y: (P,) y-offsets of pins from parent center
        net_pins: list of pin indices for each net
    """
    total_hpwl = 0.0
    for pins in net_pins:
        if len(pins) <= 1:
            continue
        xs = pos_x[pins] + pin_offsets_x[pins]
        ys = pos_y[pins] + pin_offsets_y[pins]
        total_hpwl += (np.max(xs) - np.min(xs)) + (np.max(ys) - np.min(ys))
    return float(total_hpwl)


def weighted_average_wirelength(pos_x: np.ndarray, pos_y: np.ndarray,
                               pin_offsets_x: np.ndarray, pin_offsets_y: np.ndarray,
                               net_pins: List[List[int]],
                               gamma: float = 4.0) -> Tuple[float, np.ndarray, np.ndarray]:
    """
    Computes Weighted-Average (WA) wirelength and analytical gradients.
    
    Args:
        pos_x: (N,) x-coordinates of cell/macro centers
        pos_y: (N,) y-coordinates of cell/macro centers
        pin_offsets_x: (P,) pin offsets in x from parent center
        pin_offsets_y: (P,) pin offsets in y from parent center
        net_pins: List of pin indices for each net
        gamma: smoothing parameter (smaller -> closer to exact HPWL, larger -> smoother)
        
    Returns:
        total_wirelength: float
        grad_x: (N,) gradient w.r.t pos_x
        grad_y: (N,) gradient w.r.t pos_y
    """
    N = len(pos_x)
    grad_x = np.zeros(N, dtype=float)
    grad_y = np.zeros(N, dtype=float)
    total_wl = 0.0
    
    inv_gamma = 1.0 / max(gamma, 1e-4)

    for pins in net_pins:
        if len(pins) <= 1:
            continue
            
        p_idx = np.asarray(pins, dtype=int)
        xs = pos_x[p_idx] + pin_offsets_x[p_idx]
        ys = pos_y[p_idx] + pin_offsets_y[p_idx]
        
        # Shift coordinates for numerical stability in exp
        # X-dimension
        x_max_ref = np.max(xs)
        x_min_ref = np.min(xs)
        exp_pos_x = np.exp((xs - x_max_ref) * inv_gamma)
        exp_neg_x = np.exp((x_min_ref - xs) * inv_gamma)
        
        sum_pos_x = np.sum(exp_pos_x)
        sum_neg_x = np.sum(exp_neg_x)
        
        x_wa_pos = np.sum(xs * exp_pos_x) / sum_pos_x
        x_wa_neg = np.sum(xs * exp_neg_x) / sum_neg_x
        wl_x = x_wa_pos - x_wa_neg
        
        # Y-dimension
        y_max_ref = np.max(ys)
        y_min_ref = np.min(ys)
        exp_pos_y = np.exp((ys - y_max_ref) * inv_gamma)
        exp_neg_y = np.exp((y_min_ref - ys) * inv_gamma)
        
        sum_pos_y = np.sum(exp_pos_y)
        sum_neg_y = np.sum(exp_neg_y)
        
        y_wa_pos = np.sum(ys * exp_pos_y) / sum_pos_y
        y_wa_neg = np.sum(ys * exp_neg_y) / sum_neg_y
        wl_y = y_wa_pos - y_wa_neg
        
        total_wl += (wl_x + wl_y)
        
        # Analytical gradients:
        # d/dxi (WA_pos - WA_neg)
        # d/dxi (WA_pos) = exp(xi/gamma)/sum_pos * (1 + (xi - WA_pos)/gamma)
        # d/dxi (WA_neg) = exp(-xi/gamma)/sum_neg * (1 - (xi - WA_neg)/gamma)
        gw_x = (exp_pos_x / sum_pos_x) * (1.0 + (xs - x_wa_pos) * inv_gamma) - \
               (exp_neg_x / sum_neg_x) * (1.0 - (xs - x_wa_neg) * inv_gamma)
               
        gw_y = (exp_pos_y / sum_pos_y) * (1.0 + (ys - y_wa_pos) * inv_gamma) - \
               (exp_neg_y / sum_neg_y) * (1.0 - (ys - y_wa_neg) * inv_gamma)
               
        np.add.at(grad_x, p_idx, gw_x)
        np.add.at(grad_y, p_idx, gw_y)

    return float(total_wl), grad_x, grad_y
