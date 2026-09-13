"""
workers/engines/base/odb_context.py
ODB context manager — native C++ bindings when inside OpenROAD,
regex-based DEF fallback when running standalone.
"""
from __future__ import annotations

import re
import time
import json
from pathlib import Path
from typing import Any


def _log(msg: str, level: str = "info", data: dict | None = None) -> None:
    print(json.dumps({"ts": int(time.time() * 1000), "level": level,
                       "engine": "ODBContext", "msg": msg, "data": data}), flush=True)


# ------------------------------------------------------------------ #
# Native mode (inside OpenROAD C++ environment)                        #
# ------------------------------------------------------------------ #

class _NativeODB:
    def __init__(self, def_path: str, lef_paths: list[str]) -> None:
        import odb  # type: ignore
        self._odb = odb
        self._db = odb.dbDatabase.create()
        for lef in lef_paths:
            odb.read_lef(self._db, lef)
        odb.read_def(self._db, def_path)
        self._chip = self._db.getChip()
        self._block = self._chip.getBlock()
        self._def_path = def_path

    def get_instances(self) -> list[dict[str, Any]]:
        results = []
        for inst in self._block.getInsts():
            bbox = inst.getBBox()
            results.append({
                "name": inst.getName(),
                "cell": inst.getMaster().getName(),
                "x": bbox.xMin(),
                "y": bbox.yMin(),
                "orient": str(inst.getOrient()),
                "is_macro": inst.getMaster().getType().isBlock(),
                "is_locked": inst.getPlacementStatus().isLocked(),
            })
        return results

    def move_instance(self, name: str, x: int, y: int, orient: str = "R0") -> None:
        inst = self._block.findInst(name)
        if inst is None:
            raise KeyError(f"Instance not found: {name}")
        orient_map = {
            "R0": self._odb.dbOrientType.R0,
            "R90": self._odb.dbOrientType.R90,
            "R180": self._odb.dbOrientType.R180,
            "R270": self._odb.dbOrientType.R270,
            "MX": self._odb.dbOrientType.MX,
            "MY": self._odb.dbOrientType.MY,
        }
        inst.setLocation(x, y)
        if orient in orient_map:
            inst.setOrient(orient_map[orient])

    def lock_instance(self, name: str) -> None:
        inst = self._block.findInst(name)
        if inst is None:
            raise KeyError(f"Instance not found: {name}")
        inst.setPlacementStatus(self._odb.dbPlacementStatus.LOCKED)

    def write_def(self, out_path: str) -> None:
        self._odb.write_def(self._block, out_path)


# ------------------------------------------------------------------ #
# Fallback mode (standalone, no C++ odb module)                        #
# ------------------------------------------------------------------ #

_COMPONENTS_RE = re.compile(
    r"^\s*-\s+(\S+)\s+(\S+)\s+.*?\+\s+PLACED\s+\(\s*(\d+)\s+(\d+)\s*\)\s+(\w+)",
    re.MULTILINE,
)
_LOCKED_RE = re.compile(
    r"^\s*-\s+(\S+)\s+(\S+)\s+.*?\+\s+FIXED\s+\(\s*(\d+)\s+(\d+)\s*\)\s+(\w+)",
    re.MULTILINE,
)
_MACRO_CELLS: set[str] = set()  # populated lazily from LEF in fallback


class _FallbackODB:
    def __init__(self, def_path: str, lef_paths: list[str]) -> None:
        self._def_path = def_path
        self._def_text = Path(def_path).read_text()
        self._instances: dict[str, dict[str, Any]] = {}
        self._parse_lef_macros(lef_paths)
        self._parse_def()

    def _parse_lef_macros(self, lef_paths: list[str]) -> None:
        macro_re = re.compile(r"^MACRO\s+(\S+)", re.MULTILINE)
        for lef in lef_paths:
            try:
                text = Path(lef).read_text()
                for m in macro_re.finditer(text):
                    _MACRO_CELLS.add(m.group(1))
            except FileNotFoundError:
                pass

    def _parse_def(self) -> None:
        for m in _COMPONENTS_RE.finditer(self._def_text):
            name, cell, x, y, orient = m.groups()
            self._instances[name] = {
                "name": name, "cell": cell,
                "x": int(x), "y": int(y),
                "orient": orient,
                "is_macro": cell in _MACRO_CELLS,
                "is_locked": False,
            }
        for m in _LOCKED_RE.finditer(self._def_text):
            name, cell, x, y, orient = m.groups()
            self._instances[name] = {
                "name": name, "cell": cell,
                "x": int(x), "y": int(y),
                "orient": orient,
                "is_macro": cell in _MACRO_CELLS,
                "is_locked": True,
            }

    def get_instances(self) -> list[dict[str, Any]]:
        return list(self._instances.values())

    def move_instance(self, name: str, x: int, y: int, orient: str = "R0") -> None:
        if name not in self._instances:
            raise KeyError(f"Instance not found: {name}")
        self._instances[name]["x"] = x
        self._instances[name]["y"] = y
        self._instances[name]["orient"] = orient

    def lock_instance(self, name: str) -> None:
        if name not in self._instances:
            raise KeyError(f"Instance not found: {name}")
        self._instances[name]["is_locked"] = True

    def write_def(self, out_path: str) -> None:
        """Rewrite the DEF COMPONENTS section with updated placements."""
        lines = self._def_text.splitlines()
        out_lines: list[str] = []
        in_components = False

        for line in lines:
            if line.strip().startswith("COMPONENTS"):
                in_components = True
                out_lines.append(line)
                continue
            if in_components and line.strip() == "END COMPONENTS":
                in_components = False
                out_lines.append(line)
                continue
            if in_components:
                # Rewrite placement inline
                m = re.match(r"(\s*-\s+\S+\s+\S+\s+.*?\+\s+)(?:PLACED|FIXED)(\s+\(\s*)(\d+)(\s+)(\d+)(\s*\)\s+)(\w+)(.*)", line)
                if m:
                    inst_name_match = re.match(r"\s*-\s+(\S+)", line)
                    if inst_name_match:
                        iname = inst_name_match.group(1)
                        if iname in self._instances:
                            inst = self._instances[iname]
                            status = "FIXED" if inst["is_locked"] else "PLACED"
                            out_lines.append(
                                f"    - {inst['name']} {inst['cell']}"
                                f" + {status} ( {inst['x']} {inst['y']} ) {inst['orient']} ;"
                            )
                            continue
            out_lines.append(line)

        Path(out_path).write_text("\n".join(out_lines))


# ------------------------------------------------------------------ #
# Public context manager                                               #
# ------------------------------------------------------------------ #

class ODBContext:
    """
    Context manager for reading and writing ODB/DEF placement data.

    with ODBContext(def_path, lef_paths) as ctx:
        instances = ctx.get_instances()
        ctx.move_instance("macro_0", x=1000, y=2000, orient="MX")
        ctx.lock_instance("macro_0")
        ctx.write_def("/tmp/out.def")
    """

    def __init__(self, def_path: str, lef_paths: list[str] | None = None) -> None:
        self._def_path = def_path
        self._lef_paths = lef_paths or []
        self._backend: _NativeODB | _FallbackODB | None = None

    def __enter__(self) -> ODBContext:
        try:
            self._backend = _NativeODB(self._def_path, self._lef_paths)
            _log("ODB native C++ bindings active", "info",
                 {"def": self._def_path, "lefs": self._lef_paths})
        except ImportError:
            self._backend = _FallbackODB(self._def_path, self._lef_paths)
            _log("ODB native unavailable — using DEF text fallback", "warn",
                 {"def": self._def_path})
        return self

    def __exit__(self, *_: Any) -> None:
        self._backend = None

    def get_instances(self) -> list[dict[str, Any]]:
        assert self._backend is not None
        return self._backend.get_instances()

    def move_instance(self, name: str, x: int, y: int, orient: str = "R0") -> None:
        assert self._backend is not None
        self._backend.move_instance(name, x, y, orient)

    def lock_instance(self, name: str) -> None:
        assert self._backend is not None
        self._backend.lock_instance(name)

    def write_def(self, out_path: str) -> None:
        assert self._backend is not None
        self._backend.write_def(out_path)
