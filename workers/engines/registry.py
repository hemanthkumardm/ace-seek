"""
workers/engines/registry.py
Engine registry — maps engine names to classes, dispatches CLI runs.

Honesty rules:
  - `status`: production | model_dse | stub
  - stub engines must report available=False even if the stub module imports
"""
from __future__ import annotations

import json
import os
import sys
from typing import TYPE_CHECKING, Any

_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

if TYPE_CHECKING:
    from .base.engine import BaseEngine

_ENGINE_META: dict[str, dict] = {
    "macro_placer": {
        "module": "workers.engines.macro_placer.engine",
        "class": "MacroPlacer",
        "description": "Ace-AutoMacro: electrostatic macro placement, legalization, halos, flightline/RUDY.",
        "tier": "max",
        "status": "production",
        "studio": "Runs on floorplan when hard macros are present (ACE_AUTOMACRO=1).",
    },
    "ace_forge": {
        "module": "workers.engines.forge.driver",
        "class": "run_ace_forge",
        "description": "AceForge Classic/Chip step-orchestrated PnR (AceFlow + OpenROAD).",
        "tier": "max",
        "status": "production",
        "runnable": False,
        "studio": "Select AceForge Classic or Chip in Project → Flow profile.",
    },
    "ppa_optimizer": {
        "module": "workers.engines.ppa_optimizer.engine",
        "class": "PPAOptimizer",
        "description": "Ace-Matrix PPA grid sweep — analytic/model DSE (not a live OpenLane multi-run).",
        "tier": "max",
        "status": "model_dse",
        "studio": "Offline/model exploration only. Does not replace container PnR signoff.",
    },
    "matrix_sweeper": {
        "module": "workers.engines.matrix_sweeper.sweeper",
        "class": "MatrixSweeper",
        "description": "Parallel parameter sweeper used by PPAOptimizer (simulated PPA model).",
        "tier": "max",
        "status": "model_dse",
        "runnable": False,
        "studio": "Library used by ppa_optimizer — not a standalone Studio job.",
    },
    "timing_optimizer": {
        "module": "workers.engines.timing_optimizer.engine",
        "class": "TimingOptimizer",
        "description": "Setup/hold slack repair (NOT SHIPPED — stub).",
        "tier": "max",
        "status": "stub",
        "studio": "Unavailable. Use OpenLane/OpenSTA or AceFlow ECO script generator.",
    },
    "congestion_resolver": {
        "module": "workers.engines.congestion_resolver.engine",
        "class": "CongestionResolver",
        "description": "Standalone congestion resolver (NOT SHIPPED — stub).",
        "tier": "max",
        "status": "stub",
        "studio": "Unavailable. Flightline/RUDY is inside Ace-AutoMacro today.",
    },
}


class _LazyEngineRegistry(dict):
    def __getitem__(self, name: str) -> Any:
        if dict.__contains__(self, name):
            return super().__getitem__(name)
        if name not in _ENGINE_META:
            raise KeyError(f"Engine '{name}' not registered")
        meta = _ENGINE_META[name]
        if meta.get("status") == "stub":
            raise KeyError(f"Engine '{name}' is a stub (not installed)")
        try:
            import importlib

            mod = importlib.import_module(meta["module"])
            cls = getattr(mod, meta["class"])
            super().__setitem__(name, cls)
            return cls
        except (ImportError, AttributeError) as exc:
            raise KeyError(f"Engine '{name}' failed to load: {exc}") from exc

    def get(self, name: str, default: Any = None) -> Any:
        try:
            return self[name]
        except KeyError:
            return default

    def __contains__(self, name: object) -> bool:
        if not isinstance(name, str) or name not in _ENGINE_META:
            return dict.__contains__(self, name)
        if _ENGINE_META[name].get("status") == "stub":
            return False
        try:
            self[name]
            return True
        except KeyError:
            return False

    def __iter__(self):
        return iter(_ENGINE_META)

    def __len__(self):
        return len(_ENGINE_META)

    def keys(self):
        return _ENGINE_META.keys()

    def items(self):
        result = []
        for k in _ENGINE_META:
            if _ENGINE_META[k].get("status") == "stub":
                continue
            v = self.get(k)
            if v is not None:
                result.append((k, v))
        return result

    def values(self):
        return [v for _, v in self.items()]


ENGINE_REGISTRY = _LazyEngineRegistry()


def get_engine(name: str, work_dir: str, config: dict) -> "BaseEngine":
    if name not in _ENGINE_META:
        raise ValueError(
            f"Unknown engine '{name}'. Available: {list(_ENGINE_META.keys())}"
        )
    meta = _ENGINE_META[name]
    if meta.get("status") == "stub":
        raise ImportError(f"Engine '{name}' is a stub — not installed")
    if meta.get("runnable") is False:
        raise ImportError(
            f"Engine '{name}' is not a standalone runnable — use ppa_optimizer instead"
        )

    try:
        import importlib

        mod = importlib.import_module(meta["module"])
        cls = getattr(mod, meta["class"])
    except (ImportError, AttributeError) as exc:
        raise ImportError(f"Engine '{name}' failed to load: {exc}") from exc

    return cls(work_dir=work_dir, config=config)


def list_engines() -> list[dict]:
    """Return availability + honesty metadata for Studio / API."""
    results = []
    for name, meta in _ENGINE_META.items():
        status = meta.get("status", "production")
        available = False
        if status != "stub":
            try:
                import importlib

                mod = importlib.import_module(meta["module"])
                getattr(mod, meta["class"])
                available = True
            except (ImportError, AttributeError):
                available = False

        results.append(
            {
                "name": name,
                "available": available,
                "description": meta["description"],
                "tier": meta["tier"],
                "status": status,
                "studio": meta.get("studio", ""),
            }
        )
    return results


def _cli() -> None:
    import argparse
    import pathlib

    parser = argparse.ArgumentParser(description="Run an OpenROAD engine; print JSON.")
    parser.add_argument("--engine", choices=list(_ENGINE_META.keys()))
    parser.add_argument("--work-dir")
    parser.add_argument("--config")
    parser.add_argument("--list", action="store_true")
    args = parser.parse_args()

    if args.list:
        print(json.dumps(list_engines(), indent=2))
        sys.exit(0)

    if not args.engine or not args.work_dir or not args.config:
        parser.error("--engine, --work-dir, and --config required unless --list")

    config_path = pathlib.Path(args.config)
    if config_path.exists():
        config = json.loads(config_path.read_text())
    else:
        try:
            config = json.loads(args.config)
        except Exception:
            print(json.dumps({"error": f"Invalid config: {args.config}"}))
            sys.exit(1)

    try:
        engine = get_engine(args.engine, args.work_dir, config)
        result = engine.run()
        print(json.dumps(result.to_dict(), indent=2))
        sys.exit(0)
    except Exception as exc:
        print(json.dumps({"error": str(exc), "engine": args.engine}))
        sys.exit(1)


if __name__ == "__main__":
    _cli()
