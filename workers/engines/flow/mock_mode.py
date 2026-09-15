"""
AceFlow mock / demo mode gate.

Production default: fail closed when EDA binaries are missing or exit non-zero.
Enable synthetic artifacts only with ACE_FLOW_MOCK=1 (or config allow_mock=True).
"""
from __future__ import annotations

import os
from typing import Any


def allow_mock(config: dict[str, Any] | None = None) -> bool:
    """Return True only when explicit mock mode is enabled."""
    if config and config.get("allow_mock") is True:
        return True
    flag = os.environ.get("ACE_FLOW_MOCK", "").strip().lower()
    return flag in {"1", "true", "yes", "on"}
