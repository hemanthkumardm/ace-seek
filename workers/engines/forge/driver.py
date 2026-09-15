#!/usr/bin/env python3
"""
AceForge driver — runs AceFlow steps for Classic or Chip profiles.

Usage:
  PYTHONPATH=<repo> python3 -m workers.engines.forge.driver \\
    --work-dir /path/to/job/forge_run \\
    --design top --profile classic|chip \\
    --until floorplan|placement|cts|routing|signoff|all \\
    [--rtl a.v,b.v] [--sdc constraints.sdc]
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any

from workers.engines.flow import AceFlow, DesignState
from workers.engines.flow.steps import (
    AceMacroStep,
    AceTimingEcoStep,
    EqyLecStep,
    OpenROADStep,
    YosysSynthesisStep,
)
from workers.engines.forge.pad_ring import write_pad_ring_tcl
from workers.engines.forge.profiles import resolve_profile


UNTIL_RANK = {
    "synthesis": 1,
    "floorplan": 2,
    "placement": 3,
    "cts": 4,
    "routing": 5,
    "signoff": 6,
    "gds": 6,
    "all": 99,
}


def _build_steps(profile_name: str, until: str, work_dir: str) -> list[Any]:
    profile = resolve_profile(profile_name)
    rank = UNTIL_RANK.get(until, 99)
    steps: list[Any] = []

    if rank >= 1:
        steps.append(YosysSynthesisStep(step_id="01_synthesis"))
        if os.environ.get("ACE_FORGE_LEC", "0") == "1":
            steps.append(EqyLecStep("rtl_vs_synth", step_id="02_lec_synth"))

    if rank >= 2:
        fp_tcl: list[str] = []
        if profile.enable_pad_ring:
            pad_tcl = os.path.join(work_dir, "pad_ring_intent.tcl")
            write_pad_ring_tcl(pad_tcl, design="chip")
            fp_tcl.append(f"source {pad_tcl}")
        else:
            fp_tcl.append(
                "catch { initialize_floorplan -utilization 45 -aspect_ratio 1.0 "
                "-core_space 10 -site unithd }"
            )
            fp_tcl.append("catch { place_pins -hor_layers met3 -ver_layers met2 }")
        steps.append(OpenROADStep("floorplan", fp_tcl, step_id="03_floorplan"))
        if os.environ.get("ACE_AUTOMACRO", "1") != "0":
            steps.append(AceMacroStep(halo_x=10.0, halo_y=10.0, step_id="04_ace_macro"))

    if rank >= 3:
        steps.append(
            OpenROADStep(
                "placement",
                [
                    "catch { global_placement -density 0.5 }",
                    "catch { detailed_placement }",
                ],
                step_id="05_placement",
            )
        )

    if rank >= 4:
        steps.append(
            OpenROADStep(
                "cts",
                ["catch { clock_tree_synthesis }", "catch { detailed_placement }"],
                step_id="06_cts",
            )
        )
        steps.append(AceTimingEcoStep(target_slack_ns=0.0, step_id="07_timing_eco"))

    if rank >= 5:
        steps.append(
            OpenROADStep(
                "routing",
                [
                    "catch { global_route }",
                    "catch { detailed_route }",
                ],
                step_id="08_routing",
            )
        )

    if rank >= 6:
        steps.append(
            OpenROADStep(
                "signoff",
                ["catch { report_checks -path_delay max }", "catch { report_power }"],
                step_id="09_signoff",
            )
        )
        if os.environ.get("ACE_FORGE_LEC", "0") == "1":
            steps.append(EqyLecStep("synth_vs_layout", step_id="10_lec_signoff"))

    return steps


def run_ace_forge(
    *,
    work_dir: str,
    design_name: str,
    profile: str,
    until: str,
    rtl_files: tuple[str, ...],
    sdc_file: str | None,
    allow_mock: bool = False,
) -> DesignState:
    os.makedirs(work_dir, exist_ok=True)
    prof = resolve_profile(profile)
    steps = _build_steps(prof.name, until, work_dir)
    init = DesignState(
        design_name=design_name,
        rtl_files=rtl_files or (f"rtl/{design_name}.v",),
        sdc_file=sdc_file,
    )
    flow = AceFlow(
        name=f"{design_name}_ace_forge_{prof.name}",
        steps=steps,
        work_dir=work_dir,
        config={
            "allow_mock": allow_mock,
            "continue_on_failure": False,
            "forge_profile": prof.name,
            "chip_mode": prof.chip_mode,
        },
    )
    final = flow.run(init)
    summary = {
        "profile": prof.name,
        "label": prof.label,
        "until": until,
        "status": final.status,
        "metrics": final.metrics,
        "chip_mode": prof.chip_mode,
    }
    with open(os.path.join(work_dir, "ace_forge_summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    return final


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="AceForge PnR driver")
    p.add_argument("--work-dir", required=True)
    p.add_argument("--design", default="top")
    p.add_argument("--profile", default="classic", choices=["classic", "chip"])
    p.add_argument(
        "--until",
        default="all",
        help="synthesis|floorplan|placement|cts|routing|signoff|all",
    )
    p.add_argument("--rtl", default="", help="Comma-separated RTL paths")
    p.add_argument("--sdc", default="")
    p.add_argument("--allow-mock", action="store_true")
    args = p.parse_args(argv)

    rtl = tuple(x for x in args.rtl.split(",") if x.strip())
    final = run_ace_forge(
        work_dir=args.work_dir,
        design_name=args.design,
        profile=args.profile,
        until=args.until,
        rtl_files=rtl,
        sdc_file=args.sdc or None,
        allow_mock=args.allow_mock or os.environ.get("ACE_FLOW_MOCK") == "1",
    )
    print(json.dumps({"status": final.status, "metrics": final.metrics}, indent=2))
    return 0 if final.status != "failed" else 1


if __name__ == "__main__":
    sys.exit(main())
