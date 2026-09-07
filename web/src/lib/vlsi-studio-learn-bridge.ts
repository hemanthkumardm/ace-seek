/**
 * Bidirectional map: VLSI workstations ↔ Learn Hub courses.
 * Keeps practice CTAs and theory strips consistent across the platform.
 */

import { learnCourseHref } from "@/lib/vlsi-curriculum";
import type { VlsiStudioId } from "@/components/VlsiStudioGate";

export type StudioLearnLink = {
  trackId: string;
  title: string;
  blurb: string;
  href: string;
  /** Optional deep lesson when it exists in curriculum */
  lessonHref?: string;
  lessonTitle?: string;
};

/** Primary Learn tracks for each workstation */
export const STUDIO_LEARN_LINKS: Record<VlsiStudioId, StudioLearnLink[]> = {
  sdc: [
    {
      trackId: "sdc",
      title: "SDC constraints",
      blurb: "Clocks, I/O budgets, multicycle & false paths — then author them live here.",
      href: learnCourseHref("sdc"),
    },
    {
      trackId: "cdc",
      title: "CDC & clocks",
      blurb: "Async crossings and clock groups that feed set_clock_groups.",
      href: learnCourseHref("cdc"),
    },
  ],
  timing: [
    {
      trackId: "sta",
      title: "Static timing",
      blurb: "Setup/hold, slack, path groups — then paste real STA reports here.",
      href: learnCourseHref("sta"),
    },
    {
      trackId: "cadence-sta",
      title: "Cadence Tempus (Master)",
      blurb: "Signoff STA workflows for Max-tier learners.",
      href: learnCourseHref("cadence-sta"),
    },
  ],
  mmmc: [
    {
      trackId: "mmmc",
      title: "MMMC",
      blurb: "Modes, corners, libraries, and analysis views.",
      href: learnCourseHref("mmmc"),
    },
    {
      trackId: "sdc",
      title: "SDC constraints",
      blurb: "Constraint modes attach SDC packs to each view.",
      href: learnCourseHref("sdc"),
    },
  ],
  power: [
    {
      trackId: "upf",
      title: "Power format (UPF)",
      blurb: "Domains, isolation, retention, PST — then build UPF in Power Studio.",
      href: learnCourseHref("upf"),
    },
    {
      trackId: "cadence-power",
      title: "Cadence Voltus (Master)",
      blurb: "Rail / IR / EM signoff labs for Max tier.",
      href: learnCourseHref("cadence-power"),
    },
  ],
  reports: [
    {
      trackId: "sta",
      title: "Static timing",
      blurb: "How to read STA dumps before you classify them in Report Hub.",
      href: learnCourseHref("sta"),
    },
    {
      trackId: "sdc",
      title: "SDC constraints",
      blurb: "Recognize constraint packs when they land in the hub.",
      href: learnCourseHref("sdc"),
    },
  ],
  rtl: [
    {
      trackId: "verilog",
      title: "Verilog",
      blurb: "Modules and sequential coding — then simulate in RTL Lab.",
      href: learnCourseHref("verilog"),
    },
    {
      trackId: "sv",
      title: "SystemVerilog",
      blurb: "always_ff, interfaces, synthesizable SV subset.",
      href: learnCourseHref("sv"),
    },
  ],
};

/** Studio to open when practicing from a Learn track */
export function studioForLearnTrack(
  trackId: string
): { studio: VlsiStudioId; href: string; label: string } | null {
  const map: Record<string, { studio: VlsiStudioId; href: string; label: string }> = {
    sdc: { studio: "sdc", href: "/vlsi/sdc-studio", label: "Practice in SDC Studio" },
    cdc: { studio: "sdc", href: "/vlsi/sdc-studio", label: "Practice clocks in SDC Studio" },
    sta: { studio: "timing", href: "/vlsi/timing-studio", label: "Practice in Timing Studio" },
    "cadence-sta": { studio: "timing", href: "/vlsi/timing-studio", label: "Open Timing Studio" },
    "synopsys-sta": { studio: "timing", href: "/vlsi/timing-studio", label: "Open Timing Studio" },
    "opensource-sta": { studio: "timing", href: "/vlsi/timing-studio", label: "Open Timing Studio" },
    mmmc: { studio: "mmmc", href: "/vlsi/mmmc-studio", label: "Practice in MMMC Studio" },
    upf: { studio: "power", href: "/vlsi/power-studio", label: "Practice in Power Studio" },
    "cadence-power": { studio: "power", href: "/vlsi/power-studio", label: "Open Power Studio" },
    "synopsys-power": { studio: "power", href: "/vlsi/power-studio", label: "Open Power Studio" },
    "opensource-power": { studio: "power", href: "/vlsi/power-studio", label: "Open Power Studio" },
    verilog: { studio: "reports", href: "/vlsi/rtl-lab", label: "Practice in RTL Lab" },
    sv: { studio: "reports", href: "/vlsi/rtl-lab", label: "Practice in RTL Lab" },
    synthesis: {
      studio: "reports",
      href: "/vlsi/openroad-export",
      label: "OpenROAD handoff",
    },
  };
  return map[trackId] ?? null;
}

/** Alias fixes for outdated Ask-AI / command-db hrefs */
export const LEARN_HREF_ALIASES: Record<string, string> = {
  "/vlsi/learn/c/cadence-genus": "/vlsi/learn/c/cadence-synthesis",
  "/vlsi/learn/c/physical-verif":
    "/vlsi/learn/c/cadence-pnr/innovus-physical-verification-dfm",
  "/vlsi/learn/c/dft": "/vlsi/learn/c/digital/digital-master-dft",
};
