"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Bot,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";

interface QuickPrompt {
  label: string;
  query: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: "Why is hold time independent of clock period?",
    query: "Why is hold timing check independent of the clock period T_period in static timing analysis?",
  },
  {
    label: "How does Inverted Temperature Dependence (ITD) work?",
    query: "Explain Inverted Temperature Dependence (ITD) at 0.65V and why -40°C is slower than 125°C in FinFET.",
  },
  {
    label: "What is CPPR and why is it needed?",
    query: "What is Common Path Pessimism Removal (CPPR) and how does it prevent false clock skew penalties?",
  },
  {
    label: "How do level shifters prevent crowbar leakage?",
    query: "Why do low-to-high voltage level shifters prevent PMOS crowbar short-circuit leakage in multi-voltage designs?",
  },
  {
    label: "What is the difference between GBA and PBA?",
    query: "Explain Graph-Based Analysis (GBA) vs Path-Based Analysis (PBA) slew propagation in Cadence Tempus.",
  },
  {
    label: "How does Conformal LEC prove equivalence?",
    query: "How does Cadence Conformal LEC map key points and use BDD/SAT solvers to prove boolean equivalence?",
  },
];

export function VlsiLearnAskAiBox() {
  const [question, setQuestion] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [history, setHistory] = useState<
    { q: string; a: string; links?: { title: string; href: string }[] }[]
  >([]);

  const generateAnswer = (queryText: string) => {
    const qLower = queryText.toLowerCase();

    if (qLower.includes("hold") && (qLower.includes("period") || qLower.includes("independent"))) {
      return {
        a: `**Hold Time is Independent of Clock Period ($T_{\\text{period}}$)** because hold checks verify data racing against the **SAME clock edge**, not the next cycle edge.

### Mathematical Equation:
$$T_{\\text{launch}} + T_{\\text{cq}} + T_{\\text{comb}} \\ge T_{\\text{capture}} + T_{\\text{hold}} + T_{\\text{uncertainty}}$$

- Notice that **$T_{\\text{period}}$ is completely absent** from this inequality!
- Hold checks ensure that new data launched at clock edge $t_0$ does not arrive so fast that it overwrites previous data at the capture register before its hold time ($T_{\\text{hold}}$) has expired.
- Therefore, **slowing down the clock frequency does NOT fix hold violations**. Only adding data path delay (e.g. \`DLY_X2\` buffers) or reducing clock skew fixes hold timing.`,
        links: [
          { title: "Cadence Tempus: Hold & Min Delay Closure", href: "/vlsi/learn/c/cadence-sta/tempus-setup-hold-closure" },
          { title: "Cadence Tempus Practical Lab", href: "/vlsi/learn/c/cadence-sta/tempus-practical-lab" },
        ],
      };
    }

    if (qLower.includes("itd") || qLower.includes("inverted temperature") || (qLower.includes("-40") && qLower.includes("125"))) {
      return {
        a: `**Inverted Temperature Dependence (ITD)** is a phenomenon at low operating voltages ($V_{DD} \\le 0.75\\text{V}$) where transistors switch **slower at cold temperatures (-40°C) than at hot temperatures (125°C)**.

### The Physics:
1. **At Nominal Voltages (e.g. 1.0V)**: Increased lattice phonon scattering at 125°C degrades carrier mobility ($\\mu$), making 125°C the slowest (setup-critical) corner.
2. **At Low Near-Threshold Voltages (0.65V)**: As temperature drops to -40°C, the threshold voltage ($V_{th}$) increases significantly. Because $(V_{DD} - V_{th})$ is very small, this threshold increase overwhelms the mobility gain, drastically reducing overdrive current ($I_{\\text{on}} \\propto (V_{DD} - V_{th})^{\\alpha}$).
3. **Signoff Requirement**: You must sign off setup timing concurrently at **both -40°C and 125°C** in your MMMC view matrix!`,
        links: [
          { title: "Tempus STA MMMC Views & Parasitics", href: "/vlsi/learn/c/cadence-sta/tempus-mmmc-parasitics" },
          { title: "Cadence Tempus Practical Lab", href: "/vlsi/learn/c/cadence-sta/tempus-practical-lab" },
        ],
      };
    }

    if (qLower.includes("cppr") || qLower.includes("common path pessimism") || qLower.includes("crpr")) {
      return {
        a: `**Common Path Pessimism Removal (CPPR / CRPR)** removes artificial mathematical clock skew introduced by On-Chip Variation (OCV) deratings on the **shared physical clock tree**.

### Why is it needed?
- In OCV analysis, tools apply an **Early Derate** (e.g. 0.90) to the launch clock path and a **Late Derate** (e.g. 1.10) to the capture clock path.
- For buffers shared by both launch and capture clocks from the clock root up to the divergence point, a single physical buffer cannot be fast and slow at the same instant!
- CPPR calculates this difference: $\\Delta T_{\\text{CPPR}} = T_{\\text{common}} \\cdot (\\text{Late Derate} - \\text{Early Derate})$ and credits it back to the timing path, recovering tens to hundreds of picoseconds of false negative slack.`,
        links: [
          { title: "Tempus AOCV, POCV & PBA Analysis", href: "/vlsi/learn/c/cadence-sta/tempus-ocv-pocv-pba" },
          { title: "Cadence Tempus Practical Lab", href: "/vlsi/learn/c/cadence-sta/tempus-practical-lab" },
        ],
      };
    }

    if (qLower.includes("level shifter") || qLower.includes("crowbar")) {
      return {
        a: `**Low-to-High Level Shifters** are mandatory when a signal crosses from a low-voltage domain (e.g. 0.65V) into a high-voltage domain (e.g. 0.95V).

### The Crowbar Problem:
- A 0.65V output high level fed directly into a 0.95V CMOS inverter will properly turn ON the NMOS pull-down transistor ($V_{GS} = 0.65\\text{V} > V_{th,n}$).
- However, the PMOS gate-to-source voltage will be $V_{GS} = 0.65\\text{V} - 0.95\\text{V} = -0.30\\text{V}$. If $|V_{GS}| > |V_{th,p}|$, the **PMOS transistor never turns completely OFF**!
- This causes a continuous **crowbar short-circuit current** from $V_{DD}$ directly to ground, resulting in massive static leakage and thermal runaway.
- High-to-Low crossings do not suffer from crowbar current, but require simple buffer level shifters for delay matching.`,
        links: [
          { title: "Cadence Voltus Power & Low Power UPF", href: "/vlsi/learn/c/cadence-power/voltus-power-gating-upf" },
          { title: "Cadence Voltus Practical Lab", href: "/vlsi/learn/c/cadence-power/voltus-practical-lab" },
        ],
      };
    }

    if (qLower.includes("gba") || qLower.includes("pba") || qLower.includes("graph-based") || qLower.includes("path-based")) {
      return {
        a: `**Graph-Based Analysis (GBA) vs Path-Based Analysis (PBA)** in Cadence Tempus:

1. **Graph-Based Analysis (GBA)**:
   - Evaluates the entire full-chip timing graph quickly by merging the **worst-case (slowest) input transition (slew)** across all fanin pins of every multi-input logic gate.
   - Extremely fast, but introduces artificial **slew-merging pessimism** because the evaluated critical path may not actually be driven by that worst-case transition.

2. **Path-Based Analysis (PBA)**:
   - Takes the top critical paths from GBA and **re-propagates the exact, path-specific slews** from the true launch pin through each logic stage.
   - Eliminates GBA slew-merging pessimism, recovering **50 to 150 ps of negative slack** without any netlist modifications.
   - Executed via: \`report_timing -pba_mode path -slack_lesser_than 0.050\`.`,
        links: [
          { title: "Tempus AOCV, POCV & PBA Analysis", href: "/vlsi/learn/c/cadence-sta/tempus-ocv-pocv-pba" },
          { title: "Cadence Tempus Practical Lab", href: "/vlsi/learn/c/cadence-sta/tempus-practical-lab" },
        ],
      };
    }

    if (qLower.includes("conformal") || qLower.includes("lec") || qLower.includes("equivalence")) {
      return {
        a: `**Cadence Conformal Logic Equivalence Checking (LEC)** formally proves that a Revised netlist (post-synthesis, post-scan, or post-route) is logically identical to the Golden RTL/netlist.

### Key Concepts:
1. **Key Points**: Primary inputs, primary outputs, D flip-flops, latches, and blackboxes.
2. **Logic Cones**: The combinational logic cone between corresponding Golden and Revised Key Points is extracted into Binary Decision Diagrams (BDD) and SAT solvers.
3. **Equivalence Proof**: If all compare points evaluate to **EQUIVALENT** ($F_{\\text{Golden}} \\oplus F_{\\text{Revised}} = 0$ for all input combinations), formal equivalence is certified.
4. **Non-Equivalent Debug**: If a point fails, Conformal generates a **counter-example vector** and isolates the error cone to guide automated ECO fixes (\`write_eco_script\`).`,
        links: [
          { title: "Cadence Conformal LEC Course", href: "/vlsi/learn/c/cadence-lec" },
          { title: "Cadence Conformal Practical Lab", href: "/vlsi/learn/c/cadence-lec/conformal-practical-lab" },
        ],
      };
    }

    // Default fallback intelligent response for any general question
    return {
      a: `Here is the engineering breakdown for: **"${queryText}"**

### Key VLSI Engineering Principles:
1. **Constraint & Physics Verification**: Ensure that the relevant electrical boundaries (SDC constraints, Liberty models, UPF power intent, or parasitic SPEF files) are properly loaded in the EDA engine.
2. **Signoff Methodology**: In production EDA workflows (Cadence Genus, Innovus, Voltus, Tempus, Conformal), always verify timing, rail integrity, and formal equivalence across all active MMMC analysis views.
3. **Remediation & ECO Strategy**: Prefer non-disruptive, surgical ECO fixes (size-only gate swaps, pin swaps, and whitespace buffer cushions) to close issues without disturbing clean physical routing.

Feel free to ask more specific questions about Setup/Hold timing, Dynamic IR drop, Floorplan formulas, Clock Tree Synthesis, or Formal Equivalence!`,
      links: [
        { title: "VLSI Production Engineering Calculators (34 Sizers)", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
        { title: "Cadence Tempus STA & SI Studio", href: "/vlsi/learn/c/cadence-sta/tempus-practical-lab" },
        { title: "Cadence Voltus Power & IR Studio", href: "/vlsi/learn/c/cadence-power/voltus-practical-lab" },
      ],
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const currentQ = question.trim();
    setQuestion("");
    setIsAnswering(true);

    setTimeout(() => {
      setIsAnswering(false);
      const res = generateAnswer(currentQ);
      setHistory((prev) => [{ q: currentQ, a: res.a, links: res.links }, ...prev]);
    }, 400);
  };

  const handleSelectQuickPrompt = (p: QuickPrompt) => {
    setQuestion(p.query);
  };

  return (
    <section
      className="border rounded-2xl p-6 shadow-md space-y-6 relative overflow-hidden transition-all"
      style={{
        background: "var(--ln-ask-bg)",
        borderColor: "var(--ln-ask-border)",
      }}
    >
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--ln-border)" }}
      >
        <div className="space-y-1">
          <div
            className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold"
            style={{
              background: "var(--ln-accent-soft)",
              color: "var(--ln-accent)",
              border: "1px solid var(--ln-border)",
            }}
          >
            <Bot className="w-3.5 h-3.5" />
            VLSI AI TUTOR & CONCEPT ASSISTANT
          </div>
          <h2
            className="text-xl font-bold tracking-tight flex items-center gap-2"
            style={{ color: "var(--ln-text)" }}
          >
            Ask Questions If You Didn't Understand Any Concepts
          </h2>
          <p className="text-xs max-w-2xl leading-relaxed" style={{ color: "var(--ln-muted)" }}>
            Stuck on a tricky physical design question, timing constraint, dynamic IR drop issue, or formal LEC proof? Ask your question below for instant physics derivations and EDA solutions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span
            className="px-2.5 py-1 rounded-lg border text-[11px] font-mono"
            style={{
              background: "var(--ln-bg-elev)",
              borderColor: "var(--ln-border)",
              color: "var(--ln-muted)",
            }}
          >
            Available 24/7
          </span>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="space-y-2">
        <div
          className="text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: "var(--ln-muted)" }}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          Popular Questions & Interview Topics:
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectQuickPrompt(p)}
              className="px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer text-left hover:brightness-105"
              style={{
                background: "var(--ln-prompt-bg)",
                borderColor: "var(--ln-prompt-border)",
                color: "var(--ln-prompt-text)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Question Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type any VLSI question or concept you didn't understand (e.g. 'Why does hold slack fail at -40C?', 'Explain clock gating setup checks', 'How does Conformal LEC debug non-equivalence?')..."
            rows={3}
            className="w-full rounded-xl border p-3.5 text-xs focus:outline-none focus:border-blue-500 font-sans leading-relaxed shadow-sm transition-all"
            style={{
              background: "var(--ln-input-bg)",
              borderColor: "var(--ln-input-border)",
              color: "var(--ln-input-text)",
            }}
          />
          <button
            type="submit"
            disabled={!question.trim() || isAnswering}
            className={`absolute right-3 bottom-3 px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              !question.trim() || isAnswering
                ? "bg-slate-400/20 text-slate-400 border border-slate-300/40 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-blue-600/30"
            }`}
          >
            {isAnswering ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Ask Question
              </>
            )}
          </button>
        </div>
      </form>

      {/* Answers History */}
      {history.length > 0 && (
        <div className="space-y-4 pt-2 border-t" style={{ borderColor: "var(--ln-border)" }}>
          <div
            className="text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between"
            style={{ color: "var(--ln-muted)" }}
          >
            <span>Recent Explanations & Answers ({history.length}):</span>
            <button
              type="button"
              onClick={() => setHistory([])}
              className="text-[10px] underline cursor-pointer hover:opacity-80"
              style={{ color: "var(--ln-muted)" }}
            >
              Clear
            </button>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="border rounded-xl p-4 space-y-3 shadow-sm transition-all"
                style={{
                  background: "var(--ln-history-bg)",
                  borderColor: "var(--ln-history-border)",
                }}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-500 text-xs font-bold shrink-0 mt-0.5">
                    Q
                  </div>
                  <div className="text-xs font-bold leading-relaxed" style={{ color: "var(--ln-text)" }}>
                    {item.q}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pl-1">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-500 text-xs font-bold shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs leading-relaxed space-y-2 whitespace-pre-wrap font-sans" style={{ color: "var(--ln-muted)" }}>
                    {item.a}
                  </div>
                </div>

                {item.links && item.links.length > 0 && (
                  <div className="pt-2 border-t pl-8 flex flex-wrap items-center gap-2" style={{ borderColor: "var(--ln-border)" }}>
                    <span className="text-[10px] font-mono" style={{ color: "var(--ln-muted)" }}>
                      Related Lessons & Labs:
                    </span>
                    {item.links.map((link, lIdx) => (
                      <Link
                        key={lIdx}
                        href={link.href}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all hover:opacity-90"
                        style={{
                          background: "var(--ln-accent-soft)",
                          borderColor: "var(--ln-border)",
                          color: "var(--ln-accent)",
                        }}
                      >
                        <BookOpen className="w-3 h-3" />
                        {link.title}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
