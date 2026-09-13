"""
Ace-AutoMacro: OpenROAD ODB Direct In-Memory Bridge
Provides direct Python-C++ database access when running inside OpenROAD/OpenLane,
with automatic fallback to DefDatabase for standalone operation.
"""

from typing import Dict, Tuple, List, Optional
import os
from .def_parser import DefDatabase

# Check if OpenROAD native C++ Python bindings (odb) are present
try:
    import odb
    HAS_ODB = True
except ImportError:
    HAS_ODB = False


class OdbBridge:
    """
    Direct bridge to OpenROAD C++ database (odb) with DefDatabase fallback.
    """

    def __init__(self):
        self.has_native_odb = HAS_ODB
        self.db = None
        self.block = None
        self.fallback_db = DefDatabase()

    def load_database(self, def_path: str, lef_paths: Optional[List[str]] = None) -> bool:
        """
        Loads design either via native OpenROAD odb C++ bindings or DefDatabase parser.
        """
        if self.has_native_odb:
            try:
                self.db = odb.dbDatabase.create()
                if lef_paths:
                    for lp in lef_paths:
                        if os.path.isfile(lp):
                            odb.read_lef(self.db, lp)
                self.block = odb.read_def(self.db, def_path)
                return True
            except Exception as e:
                print(f"[OdbBridge] Native odb load failed ({e}) — falling back to DefDatabase")
                self.has_native_odb = False

        self.fallback_db.read_def(def_path)
        return True

    def get_macro_instances(self, macro_regex: str = "sram|ram|macro") -> List[Dict[str, any]]:
        """
        Extracts macro instances with current coordinates and dimensions.
        """
        macros = []
        if self.has_native_odb and self.block:
            for inst in self.block.getInsts():
                m_type = inst.getMaster().getName()
                import re
                if re.search(macro_regex, m_type, re.IGNORECASE):
                    bbox = inst.getBBox()
                    dbu = self.block.getDbUnitsPerMicron()
                    macros.append({
                        "name": inst.getName(),
                        "master": m_type,
                        "x": bbox.xMin() / dbu,
                        "y": bbox.yMin() / dbu,
                        "w": (bbox.xMax() - bbox.xMin()) / dbu,
                        "h": (bbox.yMax() - bbox.yMin()) / dbu,
                        "orient": str(inst.getOrient())
                    })
            return macros

        # Fallback to DefDatabase
        import re
        for comp in self.fallback_db.components:
            if re.search(macro_regex, comp["cell_type"], re.IGNORECASE):
                macros.append({
                    "name": comp["name"],
                    "master": comp["cell_type"],
                    "x": comp["x"],
                    "y": comp["y"],
                    "w": 50.0,  # Default if LEF not supplied
                    "h": 50.0,
                    "orient": comp["orient"]
                })
        return macros

    def apply_placement_and_lock(self,
                                 macro_coords: Dict[str, Tuple[float, float, str]],
                                 out_def: Optional[str] = None) -> bool:
        """
        Locks macro positions in memory and writes out updated DEF.
        """
        if self.has_native_odb and self.block:
            dbu = self.block.getDbUnitsPerMicron()
            for name, (mx, my, orient_str) in macro_coords.items():
                inst = self.block.findInst(name)
                if inst:
                    ix = int(round(mx * dbu))
                    iy = int(round(my * dbu))
                    inst.setLocation(ix, iy)
                    inst.setPlacementStatus(odb.dbPlacementStatus.LOCKED)
            if out_def:
                odb.write_def(self.block, out_def)
                return True

        if out_def:
            self.fallback_db.write_def_with_updated_macros(out_def, macro_coords, lock_status="PLACED")
            return True
        return False
