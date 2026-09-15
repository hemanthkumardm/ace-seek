"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  FolderOpen,
  FileCode2,
  Play,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Cpu,
  Lock,
} from "lucide-react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PlanPill } from "@/components/FeatureLock";
import { VLSI_URL } from "@/lib/site";

export default function OpenroadHome() {
  const router = useRouter();
  const { ent, ready, loading, isSignedIn } = useEntitlements();

  const open = (path: string) => {
    if (isSignedIn) router.push(path);
    else router.push(`/openroad/login?redirect=${encodeURIComponent(path)}`);
  };

  return (
    <div className="min-h-full bg-[var(--neu-bg)] text-[var(--neu-text)] font-mono">
      <div className="m-shell py-10 md:py-14 space-y-10">
        <div className="neu-panel p-8 md:p-10 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/40">
            <div className="flex items-center gap-2">
              <span className="neu-panel-sm p-2">
                <Boxes className="w-5 h-5 text-sky-600" />
              </span>
              <span className="font-black uppercase tracking-wider text-sm">
                OPENROAD.ACE-SEEK.COM
              </span>
              <span className="text-sky-600 font-bold text-xs">
                // PnR AUTOMATION
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PlanPill tier={ent.tier} ready={ready && !loading} />
              <span className="neu-inset px-2 py-1 text-[10px] font-black text-sky-700">
                PRO SCRIPTS
              </span>
              <span className="neu-inset px-2 py-1 text-[10px] font-black text-amber-700">
                MAX PnR
              </span>
            </div>
          </div>

          <div className="max-w-4xl space-y-4">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight uppercase">
              OpenROAD Automation Platform →{" "}
              <span className="text-sky-700">Cloud ASIC PnR & Signoff Studio</span>
            </h1>
            <p className="text-xs md:text-sm text-[var(--neu-text-muted)] leading-relaxed font-bold max-w-3xl">
              Execute autonomous digital ASIC physical design from Verilog RTL to tapeout-ready GDSII polygons.
              Author SDC and MMMC on{" "}
              <a href={VLSI_URL} className="text-sky-700 underline">
                vlsi.ace-seek.com
              </a>
              , run containerized <strong>OpenLane</strong> PnR (Max), export Pro script packs, and—when your design has hard macros—optionally run <strong>Ace-AutoMacro</strong> during floorplan. Harvest DEF/GDS and stage reports in Studio. Formal EQY is export/local only (not a fake in-browser proof).
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                {
                  icon: FolderOpen,
                  title: "1 · Project & Design",
                  body: "Upload constraints.sdc, corners.tcl, Verilog RTL, and configure process parameters for Sky130 or GF180.",
                },
                {
                  icon: FileCode2,
                  title: "2 · Script Generation (Pro)",
                  body: "Automated Makefile, Yosys synthesis, OpenSTA timing scripts, OpenROAD Tcl commands, and container runners.",
                },
                {
                  icon: Play,
                  title: "3 · Cloud PnR Studio (Max)",
                  body: "OpenLane container jobs: Yosys → Floorplan (+ optional Ace-AutoMacro) → Place → CTS → Route → Magic/KLayout signoff.",
                },
              ] as const
            ).map(({ icon: Icon, title, body }) => (
              <div key={title} className="neu-inset p-4 space-y-2">
                <p className="text-xs font-black uppercase flex items-center gap-1.5 text-sky-800">
                  <Icon className="w-4 h-4" /> {title}
                </p>
                <p className="text-[11px] font-bold leading-snug text-[var(--neu-text-muted)]">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--neu-text-muted)]">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>
                Pro scripts · Max PnR · AceForge Classic/Chip · Cloud automation
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => open("/openroad/project")}
                className="neu-btn neu-btn-primary !text-sm !py-2.5 !px-5 font-black uppercase flex items-center gap-2"
              >
                <Boxes className="w-5 h-5" />
                <span>Open Project</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="/openroad/login"
                className="neu-btn !text-xs font-black flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isSignedIn ? "Account active" : "Sign in"}</span>
              </a>
              <a
                href={VLSI_URL}
                className="neu-btn !text-xs font-black flex items-center gap-1"
              >
                <Cpu className="w-4 h-4" />
                <span>Author on VLSI</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-sky-600">
              Platform flow
            </span>
            <h2 className="text-2xl font-black tracking-tight uppercase">
              VLSI → OpenROAD Automation Workflow
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {(
              [
                {
                  href: "/openroad/project",
                  title: "Project",
                  badge: "PRO+",
                  body: "Drop the OpenROAD-format zip or files from VLSI OpenROAD Export.",
                  cta: "Open Project",
                  lock: false,
                },
                {
                  href: "/openroad/design",
                  title: "Design",
                  badge: "PRO+",
                  body: "Edit RTL, testbench, SDC, and ace-seek-flow.json before running stages.",
                  cta: "Edit design",
                  lock: false,
                },
                {
                  href: "/openroad/studio",
                  title: "PnR Studio",
                  badge: "MAX+",
                  body: "Stage inputs, sanity checks, live OpenLane log, real metrics & GDS.",
                  cta: "Open PnR Studio",
                  lock: true,
                },
                {
                  href: "/openroad/scripts",
                  title: "Scripts",
                  badge: "PRO+",
                  body: "Full flow pack: synth.ys, opensta.tcl, openroad.tcl, Makefile, docker-run.sh.",
                  cta: "Export scripts",
                  lock: false,
                },
              ] as const
            ).map((card) => (
              <div
                key={card.href}
                className="neu-panel p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="neu-panel-sm p-2">
                      {card.title === "Project" && (
                        <FolderOpen className="w-5 h-5 text-sky-600" />
                      )}
                      {(card.title === "Design" || card.title === "Scripts") && (
                        <FileCode2 className="w-5 h-5 text-sky-600" />
                      )}
                      {card.title === "PnR Studio" && (
                        <Play className="w-5 h-5 text-sky-600" />
                      )}
                    </span>
                    <span className="neu-inset px-2 py-0.5 text-[10px] font-black text-sky-700">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-black uppercase">{card.title}</h3>
                  <p className="text-xs text-[var(--neu-text-muted)] font-bold leading-relaxed">
                    {card.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => open(card.href)}
                  className="neu-btn neu-btn-primary !text-xs w-full justify-between font-black !py-2.5 inline-flex items-center"
                >
                  <span className="inline-flex items-center gap-1">
                    {card.lock && <Lock className="w-3.5 h-3.5" />}
                    {card.cta}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Comprehensive OpenROAD Automation Technical Content for Search & Indexing ── */}
        <section id="openroad-automation-overview" className="neu-panel p-8 md:p-10 space-y-6">
          <div className="space-y-2 border-b border-white/40 pb-4">
            <span className="text-xs font-black uppercase tracking-wider text-sky-600">
              Autonomous Physical Design
            </span>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              What is OpenROAD Automation?
            </h2>
          </div>
          <div className="prose prose-sm text-[var(--neu-text)] space-y-4 max-w-none text-xs md:text-sm leading-relaxed">
            <p>
              <strong>OpenROAD Automation</strong> refers to the fully autonomous, script-driven execution of digital Application-Specific Integrated Circuit (ASIC) physical design. Traditionally, Place and Route (PnR) required hundreds of manual human-in-the-loop interventions to adjust floorplan boundaries, legalise macro placements, resolve congestion hotspots, tune clock tree skew, and eliminate Design Rule Check (DRC) violations.
            </p>
            <p>
              The <strong>Ace-Seek OpenROAD Platform</strong> eliminates these friction points by uniting open-source EDA engines (including <em>Yosys, RePlAce, OpenDP, TritonCTS, FastRoute, TritonRoute, Magic, Netgen, and OpenSTA</em>) into a unified cloud-native environment. Designers can submit standard synthesizable Verilog RTL accompanied by Synopsys Design Constraints (SDC) and achieve a <strong>clean RTL-to-GDS signoff in hours instead of weeks</strong>.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
            {[
              {
                step: "Stage 01",
                name: "Logic Synthesis",
                tool: "Yosys + ABC",
                desc: "RTL elaboration, logic optimization, technology mapping to standard cell target library, and area/gate-count reporting."
              },
              {
                step: "Stage 02",
                name: "Auto Floorplan & PDN",
                tool: "OpenROAD Floorplanner",
                desc: "Die boundary sizing, IO pin placement (random or configuration-constrained), and multi-layer power ring and rail strap generation."
              },
              {
                step: "Stage 03",
                name: "Macro Placement",
                tool: "Ace-AutoMacro (optional)",
                desc: "When hard macros exist, OpenLane floorplan can invoke Ace-AutoMacro (flightline affinity, halos). Toggle in Studio → Engines. Stdcell-only designs skip it."
              },
              {
                step: "Stage 04",
                name: "Global & Detailed Placement",
                tool: "RePlAce + OpenDP",
                desc: "Flat analytical electrostatic placement followed by legalisation, cell padding, and diode insertion for antenna rule mitigation."
              },
              {
                step: "Stage 05",
                name: "Clock Tree Synthesis",
                tool: "TritonCTS",
                desc: "Balanced H-tree / mesh synthesis, clock inverter and buffer insertion, skew minimization, and multi-corner latency optimization."
              },
              {
                step: "Stage 06",
                name: "Global & Detailed Route",
                tool: "FastRoute + TritonRoute",
                desc: "Grid-based global routing followed by multi-threaded detailed routing across all metal layers with pin-access DRC avoidance."
              },
              {
                step: "Stage 07",
                name: "Signoff STA & IR Drop",
                tool: "OpenSTA + PSM",
                desc: "Multi-corner multi-mode (min/nom/max) static timing verification with full SPEF parasitic extraction and static power rail IR drop."
              },
              {
                step: "Stage 08",
                name: "Physical Signoff (DRC/LVS)",
                tool: "Magic + Netgen",
                desc: "GDSII mask generation, Magic design rule verification, SPICE netlist extraction, and Netgen Layout Versus Schematic (LVS) proof."
              }
            ].map((stg) => (
              <div key={stg.step} className="neu-inset p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black">
                  <span className="text-sky-700">{stg.step}</span>
                  <span className="text-[10px] text-[var(--neu-text-muted)] uppercase">{stg.tool}</span>
                </div>
                <h4 className="text-sm font-black uppercase text-[var(--neu-text)]">{stg.name}</h4>
                <p className="text-[11px] text-[var(--neu-text-muted)] font-bold leading-relaxed">{stg.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Supported PDKs & Process Technologies ── */}
        <section id="supported-pdks" className="neu-panel p-8 md:p-10 space-y-6">
          <div className="space-y-2 border-b border-white/40 pb-4">
            <span className="text-xs font-black uppercase tracking-wider text-sky-600">
              Foundry PDK Ecosystem
            </span>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              Supported Process Technologies
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="neu-inset p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-700">SkyWater 130nm</span>
                <span className="neu-panel-sm px-2 py-0.5 text-[10px] font-black text-emerald-700">Production Ready</span>
              </div>
              <h3 className="text-base font-black uppercase">SkyWater sky130A / sky130B</h3>
              <p className="text-xs text-[var(--neu-text-muted)] font-bold leading-relaxed">
                Full high-density standard cell libraries (<code className="text-sky-800">sky130_fd_sc_hd</code>), 5 metal layer interconnect stack (met1 to met5), IO pads, embedded SRAM compilers, and experimental ReRAM non-volatile memories for IoT and edge microcontrollers.
              </p>
            </div>
            <div className="neu-inset p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-700">GlobalFoundries 180nm</span>
                <span className="neu-panel-sm px-2 py-0.5 text-[10px] font-black text-blue-700">Automotive / Mixed-Signal</span>
              </div>
              <h3 className="text-base font-black uppercase">GF180MCU Node</h3>
              <p className="text-xs text-[var(--neu-text-muted)] font-bold leading-relaxed">
                Open-source 3.3V / 5V microcontroller process ideal for analog/mixed-signal, power management, and rugged industrial controllers. Supports both 7-track and 9-track digital standard cells with thick top metal routing.
              </p>
            </div>
            <div className="neu-inset p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-700">ASAP 7nm Predictive</span>
                <span className="neu-panel-sm px-2 py-0.5 text-[10px] font-black text-purple-700">Advanced FinFET</span>
              </div>
              <h3 className="text-base font-black uppercase">Arizona State 7nm Node</h3>
              <p className="text-xs text-[var(--neu-text-muted)] font-bold leading-relaxed">
                Predictive sub-10nm FinFET technology library for high-performance computing research, multi-GHz pipelined RISC-V processors, and cutting-edge congestion and timing closure experimentation.
              </p>
            </div>
          </div>
        </section>

        {/* ── Comparison Table: Manual PnR vs Ace-Seek OpenROAD Automation ── */}
        <section id="comparison-table" className="neu-panel p-8 md:p-10 space-y-6">
          <div className="space-y-2 border-b border-white/40 pb-4">
            <span className="text-xs font-black uppercase tracking-wider text-sky-600">
              EDA Workflow Evolution
            </span>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              Traditional Physical Design vs. Ace-Seek OpenROAD Automation
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm font-mono border-collapse">
              <thead>
                <tr className="border-b-2 border-white/40 text-[var(--neu-text)] uppercase text-[11px] font-black">
                  <th className="py-3 px-4">Design Dimension</th>
                  <th className="py-3 px-4 text-rose-800">Traditional ASIC Implementation</th>
                  <th className="py-3 px-4 text-sky-700">Ace-Seek OpenROAD Cloud Automation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20 text-[11px] md:text-xs">
                <tr>
                  <td className="py-3 px-4 font-black">Tool Infrastructure</td>
                  <td className="py-3 px-4 text-[var(--neu-text-muted)]">Requires local multi-gigabyte EDA installs, Linux workstation licensing, and complex Volare setup.</td>
                  <td className="py-3 px-4 text-emerald-800 font-bold">Zero-install browser execution. Fully containerized Docker runners with pre-activated PDKs.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-black">Macro Placement</td>
                  <td className="py-3 px-4 text-[var(--neu-text-muted)]">Manual floorplan coordinate calculations, manual halo spacing, and trial-and-error routability.</td>
                  <td className="py-3 px-4 text-emerald-800 font-bold">Autonomous flightline attraction, aspect-ratio matching, edge orientation, and automatic halo synthesis.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-black">Turnaround Cycle</td>
                  <td className="py-3 px-4 text-[var(--neu-text-muted)]">Days or weeks spent modifying floorplan scripts and investigating manual routing congestion.</td>
                  <td className="py-3 px-4 text-emerald-800 font-bold">Hours from RTL to GDS. Continuous stage checkpoints (Synthesis → Floorplan → Place → CTS → Route).</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-black">Layout Verification</td>
                  <td className="py-3 px-4 text-[var(--neu-text-muted)]">Separate license checkouts for Calibre/Pegasus and cumbersome DEF-to-GDS stream-out workflows.</td>
                  <td className="py-3 px-4 text-emerald-800 font-bold">Integrated Magic DRC, Netgen LVS, and OpenSTA multi-corner timing reports generated automatically.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-black">Deliverable Export</td>
                  <td className="py-3 px-4 text-[var(--neu-text-muted)]">Scattered directory structures across compute nodes and NFS shares.</td>
                  <td className="py-3 px-4 text-emerald-800 font-bold">Single-click download of GDSII, gate-level netlists (.v), DEF, SDC, and signoff summary reports.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Frequently Asked Questions (FAQ) Section ── */}
        <section id="openroad-faq" className="neu-panel p-8 md:p-10 space-y-6">
          <div className="space-y-2 border-b border-white/40 pb-4">
            <span className="text-xs font-black uppercase tracking-wider text-sky-600">
              Common Inquiries
            </span>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              Frequently Asked Questions (FAQ)
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "What is OpenROAD and how does automation change chip design?",
                a: "OpenROAD is an open-source DARPA-funded initiative that delivers complete, autonomous RTL-to-GDSII physical design tools without human-in-the-loop dependencies. By automating floorplanning, placement, clock tree synthesis, routing, and signoff timing, designers can tape out production-ready chips with unprecedented speed and zero commercial EDA license overhead."
              },
              {
                q: "Can I run OpenROAD automation directly in my web browser?",
                a: "Yes. Ace-Seek provides a complete web-based interface and cloud orchestration layer for OpenROAD. You can upload your RTL and SDC constraints, trigger containerized execution on our high-performance runners, observe real-time log outputs, visualize intermediate DEF layouts, and download tapeout deliverables without touching a local terminal."
              },
              {
                q: "How does Ace-Seek handle macro floorplanning with 100+ SRAM blocks?",
                a: "Ace-AutoMacro is an optional floorplan hook inside Max OpenLane jobs when the DEF contains hard macros (SRAM/IP). It uses flightline/RUDY heuristics for macro legalization and halos. It is not a separate always-on Studio solver — enable/disable it under Studio → Engines (ACE_AUTOMACRO). Stdcell-only designs bypass it automatically."
              },
              {
                q: "Are the GDSII files produced by Ace-Seek OpenROAD tapeout-ready?",
                a: "Yes. The flow utilizes Magic for geometric Design Rule Checks (DRC) against foundry rule decks, Netgen for Layout Versus Schematic (LVS) formal equivalence, and OpenSTA for setup/hold timing closure across multi-corner operating temperatures and voltages (min, nom, max PVT)."
              },
              {
                q: "What design file formats can I upload and export?",
                a: "You can upload synthesizable Verilog (.v, .sv), Synopsys Design Constraints (.sdc), multi-corner Tcl scripts (.tcl), LEF physical libraries, and DEF floorplan templates. Exportable deliverables include industry-standard GDSII (.gds), DEF layout (.def), gate-level netlists (.nl.v), parasitic SPEF (.spef), and SDF delay files."
              }
            ].map((faq, idx) => (
              <div key={idx} className="neu-inset p-5 space-y-2">
                <h3 className="text-sm font-black uppercase text-sky-800 flex items-center gap-2">
                  <span>Q:</span> {faq.q}
                </h3>
                <p className="text-xs text-[var(--neu-text-muted)] font-bold leading-relaxed pl-5">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
