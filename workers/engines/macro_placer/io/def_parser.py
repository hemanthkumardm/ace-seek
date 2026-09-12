"""
Ace-AutoMacro: DEF File Parser & Emitter
Parses DIEAREA, COMPONENTS, and NETS from standard DEF files; emits updated placement.
"""

from typing import Dict, List, Tuple, Any, Optional
import re


class DefDatabase:
    """
    Lightweight, high-speed parser for Physical Design Exchange Format (DEF).
    """

    def __init__(self):
        self.units_distance_microns: float = 1000.0  # Default 1000 DBU = 1 um
        self.die_area: Tuple[float, float, float, float] = (0.0, 0.0, 1000.0, 1000.0)
        self.components: List[Dict[str, Any]] = []
        self.nets: List[Dict[str, Any]] = []
        self.raw_lines: List[str] = []

    def read_def(self, def_path: str) -> None:
        """Parses a DEF file."""
        with open(def_path, "r", encoding="utf-8", errors="ignore") as f:
            self.raw_lines = f.readlines()

        in_components = False
        in_nets = False
        cur_net: Optional[Dict[str, Any]] = None

        for line in self.raw_lines:
            line_str = line.strip()

            # Units
            if line_str.startswith("UNITS DISTANCE MICRONS"):
                m = re.search(r"UNITS DISTANCE MICRONS\s+(\d+)", line_str)
                if m:
                    self.units_distance_microns = float(m.group(1))

            # Die Area
            elif line_str.startswith("DIEAREA"):
                m = re.findall(r"[\d-]+", line_str)
                if len(m) >= 4:
                    dbu = self.units_distance_microns
                    self.die_area = (
                        float(m[0]) / dbu,
                        float(m[1]) / dbu,
                        float(m[2]) / dbu,
                        float(m[3]) / dbu,
                    )

            # Components
            elif line_str.startswith("COMPONENTS"):
                in_components = True
            elif in_components and line_str.startswith("END COMPONENTS"):
                in_components = False
            elif in_components and line_str.startswith("-"):
                # Component definition: - inst_name cell_type + PLACED ( x y ) orient
                parts = line_str.split()
                if len(parts) >= 3:
                    name = parts[1]
                    cell_type = parts[2]
                    x, y = 0.0, 0.0
                    orient = "N"
                    status = "UNPLACED"

                    m_pos = re.search(r"\+\s+(PLACED|FIXED|COVER|UNPLACED)\s*\(\s*([\d-]+)\s+([\d-]+)\s*\)\s*(\w+)?", line_str)
                    if m_pos:
                        status = m_pos.group(1)
                        dbu = self.units_distance_microns
                        x = float(m_pos.group(2)) / dbu
                        y = float(m_pos.group(3)) / dbu
                        orient = m_pos.group(4) or "N"

                    self.components.append({
                        "name": name,
                        "cell_type": cell_type,
                        "x": x,
                        "y": y,
                        "orient": orient,
                        "status": status,
                        "line": line_str
                    })

            # Nets
            elif line_str.startswith("NETS"):
                in_nets = True
            elif in_nets and line_str.startswith("END NETS"):
                in_nets = False
            elif in_nets and line_str.startswith("-"):
                parts = line_str.split()
                net_name = parts[1]
                cur_net = {"name": net_name, "pins": []}
                self.nets.append(cur_net)
                # Parse pins on the same line if present
                for pin_match in re.finditer(r"\(\s*([^\s]+)\s+([^\s]+)\s*\)", line_str):
                    cur_net["pins"].append((pin_match.group(1), pin_match.group(2)))
            elif in_nets and cur_net is not None:
                for pin_match in re.finditer(r"\(\s*([^\s]+)\s+([^\s]+)\s*\)", line_str):
                    cur_net["pins"].append((pin_match.group(1), pin_match.group(2)))

    def write_def_with_updated_macros(self, out_path: str,
                                      macro_positions: Dict[str, Tuple[float, float, str]],
                                      lock_status: str = "PLACED") -> None:
        """
        Emits updated DEF file with new coordinates and status for specified macros.
        """
        dbu = self.units_distance_microns
        with open(out_path, "w", encoding="utf-8") as out:
            in_components = False
            for line in self.raw_lines:
                line_str = line.strip()
                if line_str.startswith("COMPONENTS"):
                    in_components = True
                    out.write(line)
                    continue
                elif in_components and line_str.startswith("END COMPONENTS"):
                    in_components = False
                    out.write(line)
                    continue

                if in_components and line_str.startswith("-"):
                    parts = line_str.split()
                    if len(parts) >= 3:
                        name = parts[1]
                        if name in macro_positions:
                            mx, my, orient = macro_positions[name]
                            ix = int(round(mx * dbu))
                            iy = int(round(my * dbu))
                            cell_type = parts[2]
                            # Write locked / placed coordinate
                            new_line = f"    - {name} {cell_type} + {lock_status} ( {ix} {iy} ) {orient} ;\n"
                            out.write(new_line)
                            continue

                out.write(line)
