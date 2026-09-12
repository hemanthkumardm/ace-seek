"""
Ace-AutoMacro: Manufacturing Grid & PDN Pitch Snapping
Snaps legalized macro coordinates to site rows, PDN straps, and manufacturing units.
"""

from typing import Tuple
import numpy as np


def snap_to_manufacturing_grid(pos_x: np.ndarray, pos_y: np.ndarray,
                               site_height: float = 2.72,
                               site_width: float = 0.46,
                               mfg_grid: float = 0.005,
                               core_padding: float = 5.0,
                               core_w: float = 1000.0,
                               core_h: float = 1000.0,
                               widths: np.ndarray = None,
                               heights: np.ndarray = None) -> Tuple[np.ndarray, np.ndarray]:
    """
    Snaps macro positions to standard cell row heights and site pitches.
    
    Args:
        pos_x, pos_y: (K,) Macro lower-left coordinates
        site_height: Standard cell row height (e.g. 2.72 um for Sky130)
        site_width: Standard cell site width (e.g. 0.46 um for Sky130)
        mfg_grid: Manufacturing grid resolution (e.g. 0.005 um)
        core_padding: Inset margin from core boundaries
    """
    snapped_x = pos_x.copy()
    snapped_y = pos_y.copy()

    # Apply core inset
    if core_padding > 0.0:
        snapped_x = np.maximum(snapped_x, core_padding)
        snapped_y = np.maximum(snapped_y, core_padding)

    # Snap Y to integer multiples of site row height
    snapped_y = np.round(snapped_y / site_height) * site_height

    # Snap X to integer multiples of site width
    snapped_x = np.round(snapped_x / site_width) * site_width

    # Fine-grain round to manufacturing grid
    snapped_x = np.round(snapped_x / mfg_grid) * mfg_grid
    snapped_y = np.round(snapped_y / mfg_grid) * mfg_grid

    # Clamping against upper core boundary
    if widths is not None and heights is not None:
        snapped_x = np.minimum(snapped_x, core_w - core_padding - widths)
        snapped_y = np.minimum(snapped_y, core_h - core_padding - heights)

    return snapped_x, snapped_y
