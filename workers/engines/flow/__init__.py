"""
workers/engines/flow/__init__.py
AceFlow: Modular, step-based ASIC physical design pipeline.
Immutable DesignState, hermetic per-step dirs, fail-closed by default.
Synthetic demos require ACE_FLOW_MOCK=1.
"""
from workers.engines.flow.flow import AceFlow
from workers.engines.flow.mock_mode import allow_mock
from workers.engines.flow.state import DesignState
from workers.engines.flow.step import FlowStep

__all__ = [
    "DesignState",
    "FlowStep",
    "AceFlow",
    "allow_mock",
]
