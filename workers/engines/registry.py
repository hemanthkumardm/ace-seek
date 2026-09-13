"""
workers/engines/registry.py
Engine registry — maps engine names to classes, dispatches CLI runs.

Usage:
    from workers.engines.registry import get_engine, list_engines, ENGINE_REGISTRY

    engine = get_engine("macro_placer", work_dir="/tmp/r1", config={...})
    result = engine.run()
    print(result.to_dict())

CLI:
    python registry.py --engine macro_placer \
                       --work-dir /tmp/run1   \
                       --config config.json
"""
from __future__ import annotations

import json
import os
import sys
from typing import TYPE_CHECKING, Any

# Ensure repo root is on sys.path for direct CLI execution
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

if TYPE_CHECKING:
    from .base.engine import BaseEngine

# ------------------------------------------------------------------ #
# Engine metadata (source of truth)                                    #
# ------------------------------------------------------------------ #

_ENGINE_META: dict[str, dict] = {
    "macro_placer": {
        "module": "workers.engines.macro_placer.engine",
        "class": "MacroPlacer",
        "description": "Electrostatic-force macro placement with legalisation and halo enforcement.",
        "tier": "pro",
    },
    "ppa_optimizer": {
        "module": "workers.engines.ppa_optimizer.engine",
        "class": "PPAOptimizer",
        "description": "Grid-sweep PPA optimiser — Pareto front across power / performance / area.",
        "tier": "max",
    },
    "timing_optimizer": {
        "module": "workers.engines.timing_optimizer.engine",
        "class": "TimingOptimizer",
        "description": "Setup/hold slack repair via buffer insertion and useful skew modelling.",
        "tier": "max",
    },
    "congestion_resolver": {
        "module": "workers.engines.congestion_resolver.engine",
        "class": "CongestionResolver",
        "description": "RUDY density map analysis with cell spreading and layer preference tuning.",
        "tier": "max",
    },
}


# ------------------------------------------------------------------ #
# Lazy Registry Mapping                                                #
# ------------------------------------------------------------------ #

class _LazyEngineRegistry(dict):
    """
    Lazy dictionary mapping engine names to engine classes.
    Resolves imports on demand to prevent circular dependencies.
    """

    def __getitem__(self, name: str) -> Any:
        if dict.__contains__(self, name):
            return super().__getitem__(name)
        if name not in _ENGINE_META:
            raise KeyError(f"Engine '{name}' not registered")
        meta = _ENGINE_META[name]
        try:
            import importlib
            mod = importlib.import_module(meta["module"])
            cls = getattr(mod, meta["class"])
            super().__setitem__(name, cls)
            return cls
        except (ImportError, AttributeError) as exc:
            raise KeyError(f"Engine '{name}' is not installed or failed to load: {exc}")

    def get(self, name: str, default: Any = None) -> Any:
        try:
            return self[name]
        except KeyError:
            return default

    def __contains__(self, name: object) -> bool:
        if dict.__contains__(self, name):
            return True
        if isinstance(name, str) and name in _ENGINE_META:
            try:
                self[name]
                return True
            except KeyError:
                return False
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
            v = self.get(k)
            if v is not None:
                result.append((k, v))
        return result

    def values(self):
        return [v for _, v in self.items()]


ENGINE_REGISTRY = _LazyEngineRegistry()


# ------------------------------------------------------------------ #
# Public API                                                           #
# ------------------------------------------------------------------ #

def get_engine(name: str, work_dir: str, config: dict) -> "BaseEngine":
    """
    Instantiate and return an engine by name.
    Raises ValueError for unknown names, ImportError if engine not yet built.
    """
    if name not in _ENGINE_META:
        raise ValueError(
            f"Unknown engine '{name}'. Available: {list(_ENGINE_META.keys())}"
        )

    meta = _ENGINE_META[name]
    try:
        import importlib
        mod = importlib.import_module(meta["module"])
        cls = getattr(mod, meta["class"])
    except (ImportError, AttributeError) as exc:
        raise ImportError(
            f"Engine '{name}' is registered but not yet installed: {exc}"
        ) from exc

    return cls(work_dir=work_dir, config=config)


def list_engines() -> list[dict]:
    """
    Return availability info for all registered engines.
    Used by the /api/openroad/engines Next.js route.
    """
    results = []
    for name, meta in _ENGINE_META.items():
        try:
            import importlib
            mod = importlib.import_module(meta["module"])
            getattr(mod, meta["class"])
            available = True
        except (ImportError, AttributeError):
            available = False

        results.append({
            "name": name,
            "available": available,
            "description": meta["description"],
            "tier": meta["tier"],
        })
    return results


# ------------------------------------------------------------------ #
# CLI dispatcher                                                       #
# ------------------------------------------------------------------ #

def _cli() -> None:
    import argparse
    import pathlib

    parser = argparse.ArgumentParser(
        description="Run an OpenROAD engine and print PPAResult as JSON."
    )
    parser.add_argument("--engine",
                        choices=list(_ENGINE_META.keys()),
                        help="Engine to run")
    parser.add_argument("--work-dir",
                        help="Working directory for this run")
    parser.add_argument("--config",
                        help="Path to JSON config file or raw JSON string")
    parser.add_argument("--list", action="store_true",
                        help="List all engines and exit")
    args = parser.parse_args()

    if args.list:
        print(json.dumps(list_engines(), indent=2))
        sys.exit(0)

    if not args.engine or not args.work_dir or not args.config:
        parser.error("--engine, --work-dir, and --config are required unless --list is passed.")

    config_path = pathlib.Path(args.config)
    if config_path.exists():
        config = json.loads(config_path.read_text())
    else:
        try:
            config = json.loads(args.config)
        except Exception:
            print(json.dumps({"error": f"Config file not found or invalid JSON: {args.config}"}))
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
