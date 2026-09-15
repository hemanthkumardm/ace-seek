"""AceForge profile definitions (Classic block harden vs Chip pad-ring)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


ForgeProfileName = Literal["classic", "chip"]


@dataclass(frozen=True)
class ForgeProfile:
    name: ForgeProfileName
    label: str
    chip_mode: bool
    description: str
    # Floorplan / IO emphasis
    enable_pad_ring: bool
    core_util_default: float
    density_default: float


PROFILES: dict[str, ForgeProfile] = {
    "classic": ForgeProfile(
        name="classic",
        label="AceForge Classic",
        chip_mode=False,
        description="Block / macro harden — AceFlow steps with hermetic checkpoints.",
        enable_pad_ring=False,
        core_util_default=45.0,
        density_default=0.50,
    ),
    "chip": ForgeProfile(
        name="chip",
        label="AceForge Chip",
        chip_mode=True,
        description="Full-chip intent — pad ring hooks, IO/seal emphasis, package-ready FP.",
        enable_pad_ring=True,
        core_util_default=40.0,
        density_default=0.45,
    ),
}


def resolve_profile(name: str | None) -> ForgeProfile:
    key = (name or "classic").strip().lower()
    if key in ("ace_forge_chip", "chip", "fullchip"):
        return PROFILES["chip"]
    return PROFILES["classic"]
