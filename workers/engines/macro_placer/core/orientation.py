"""
Ace-AutoMacro: Macro Orientation & Pin-Facing-Core Engine
Enforces the critical physical design guideline: macro pins must face inward
toward the core standard cells to prevent 180-degree wrap-around wirelength.
"""

from typing import List, Dict, Tuple
import numpy as np


def resolve_macro_orientations(pos_x: np.ndarray, pos_y: np.ndarray,
                               widths: np.ndarray, heights: np.ndarray,
                               core_w: float, core_h: float,
                               pin_side_default: str = "SOUTH") -> List[str]:
    """
    Determines legal macro orientation (N, S, W, E, FN, FS, etc.) based on
    the macro's location relative to core boundaries and core center.
    
    Guideline:
    - Macros placed near the South border: Pins should face North (toward core).
    - Macros placed near the North border: Pins should face South (toward core).
    - Macros placed near the West border: Pins should face East (toward core).
    - Macros placed near the East border: Pins should face West (toward core).
    
    Assuming default macro pin edge is `pin_side_default` (usually South or East for Sky130 SRAMs):
    We apply the corresponding transformation (R0=N, R180=S, MX=Mirror X, MY=Mirror Y).
    """
    K = len(pos_x)
    orientations: List[str] = []

    core_cx = 0.5 * core_w
    core_cy = 0.5 * core_h

    for i in range(K):
        cx = pos_x[i] + 0.5 * widths[i]
        cy = pos_y[i] + 0.5 * heights[i]

        dx = cx - core_cx
        dy = cy - core_cy

        # Determine dominant boundary placement quadrant
        # If absolute horizontal displacement is larger than vertical:
        if abs(dx) >= abs(dy):
            if dx < 0:
                # Placed on the West side -> Pins should face EAST (toward center)
                target_facing = "EAST"
            else:
                # Placed on the East side -> Pins should face WEST (toward center)
                target_facing = "WEST"
        else:
            if dy < 0:
                # Placed on the South side -> Pins should face NORTH (toward center)
                target_facing = "NORTH"
            else:
                # Placed on the North side -> Pins should face SOUTH (toward center)
                target_facing = "SOUTH"

        # Map target facing direction to DEF standard orientations:
        # 'N'  (R0   - Normal default)
        # 'S'  (R180 - Inverted)
        # 'FN' (MY   - Flipped Normal / Mirrored across X)
        # 'FS' (MX   - Flipped South  / Mirrored across Y)
        if pin_side_default == "SOUTH":
            if target_facing == "NORTH":
                orient = "S"    # Rotates 180 so South pins face North
            elif target_facing == "SOUTH":
                orient = "N"    # Default South facing
            elif target_facing == "EAST":
                orient = "FS"   # Flipped orientation
            else:
                orient = "FN"
        else:
            # Generic mapping
            if target_facing in ("NORTH", "EAST"):
                orient = "S"
            else:
                orient = "N"

        orientations.append(orient)

    return orientations
