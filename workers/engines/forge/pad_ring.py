"""
AceForge Chip — pad-ring intent script generator (OpenROAD Tcl).

Produces educational / starter pad-ring placement constraints.
Not a foundry-qualified IO cell library placer — operators refine with PDK IO LEFs.
"""
from __future__ import annotations

import os
from typing import Sequence


def write_pad_ring_tcl(
    out_path: str,
    *,
    design: str,
    die_w_um: float = 1000.0,
    die_h_um: float = 1000.0,
    pad_pitch_um: float = 80.0,
    signal_ports: Sequence[str] | None = None,
) -> str:
    ports = list(signal_ports or ["clk", "rst_n", "gpio0", "gpio1"])
    margin = 40.0
    lines = [
        f"# AceForge Chip — pad ring intent for {design}",
        "# Refine with PDK IO LEF masters before tapeout.",
        f"# Die (um): {die_w_um} x {die_h_um}  pitch≈{pad_pitch_um}",
        "",
        "puts \"ACE-Seek AceForge Chip: applying pad-ring floorplan intent\"",
        "",
        f"set die_w {die_w_um}",
        f"set die_h {die_h_um}",
        f"set m {margin}",
        "set core_llx $m",
        "set core_lly $m",
        "set core_urx [expr {$die_w - $m}]",
        "set core_ury [expr {$die_h - $m}]",
        "",
        "# Prefer a core inset so IO/pad sites can sit on the periphery",
        "if { [catch {",
        "  initialize_floorplan -die_area \"0 0 $die_w $die_h\" "
        "-core_area \"$core_llx $core_lly $core_urx $core_ury\" -site unithd",
        "}] } {",
        "  puts \"ACE-Seek: floorplan init soft-fail — continuing\"",
        "}",
        "",
        "# Pin/edge intent (OpenROAD place_pins when IO LEFs absent)",
        "catch { place_pins -hor_layers met3 -ver_layers met2 }",
        "",
    ]
    # Document intended pad sides for operators
    lines.append("puts \"ACE-Seek AceForge Chip: signal pad intent:\"")
    for i, p in enumerate(ports):
        side = ["N", "E", "S", "W"][i % 4]
        lines.append(f"puts \"  port {p} → side {side}\"")
    lines.append("")
    lines.append("puts \"ACE-Seek AceForge Chip: pad-ring intent applied\"")
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    return out_path
