/**
 * VLSI Learn — theory, videos, LeetCode-style practicals, quizzes, tests.
 * Studio tools (RTL Lab, SDC/Timing/MMMC/Power) live under VLSI Studio, not here.
 */

import { LEARN_LAYER_SESSIONS } from "@/lib/vlsi-curriculum-layers";

export type LearnKind = "theory" | "video" | "practical" | "quiz" | "test";

export type LearnLayer = "beginner" | "standard" | "expert" | "master";

export type PracticalLanguage =
  | "tcl"
  | "verilog"
  | "text"
  | "perl"
  | "bash"
  | "python"
  | "vim"
  | "xml";

export type PracticalCheck = {
  id: string;
  label: string;
  kind: "includes" | "regex" | "excludes";
  pattern: string;
  flags?: string;
};

export type PracticalProblem = {
  language: PracticalLanguage;
  starter: string;
  checks: PracticalCheck[];
  solution: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  answer: number;
  explain: string;
};

export type LearnSession = {
  slug: string;
  track: string;
  kind: LearnKind;
  title: string;
  minutes: number;
  level: "foundations" | "working" | "advanced";
  layer?: LearnLayer;
  difficulty?: "easy" | "medium" | "hard";
  summary: string;
  body: string[];
  code?: { title: string; lang: string; source: string };
  checklist?: string[];
  questions?: QuizQuestion[];
  passMark?: number;
  youtubeId?: string;
  youtubeTitle?: string;
  problem?: PracticalProblem;
};

export type LearnGroupId =
  | "digital"
  | "hdl"
  | "synthesis"
  | "constraints"
  | "timing"
  | "power"
  | "verification"
  | "scripting"
  | "formats"
  | "cadence_eda"
  | "synopsys_eda"
  | "opensource_eda";

export type LearnGroup = {
  id: LearnGroupId;
  title: string;
  blurb: string;
};

export const LEARN_GROUPS: LearnGroup[] = [
  {
    id: "digital",
    title: "Digital design",
    blurb: "Gates, flops, FSMs — the hardware under the HDL.",
  },
  {
    id: "hdl",
    title: "HDL",
    blurb: "Verilog and SystemVerilog for RTL.",
  },
  {
    id: "synthesis",
    title: "RTL synthesis",
    blurb: "From RTL to gates: mapping, constraints, reports.",
  },
  {
    id: "constraints",
    title: "Constraints",
    blurb: "SDC and the MMMC view matrix.",
  },
  {
    id: "timing",
    title: "Timing & CDC",
    blurb: "STA, slack, and clock-domain crossings.",
  },
  {
    id: "power",
    title: "Power format",
    blurb: "UPF: domains, isolation, retention.",
  },
  {
    id: "verification",
    title: "Verification",
    blurb: "Testbenches, coverage, and UVM.",
  },
  {
    id: "scripting",
    title: "EDA scripting",
    blurb: "Tcl, bash, gvim, Perl, Python.",
  },
  {
    id: "formats",
    title: "Data formats",
    blurb: "XML, IP-XACT, and report dumps.",
  },
  {
    id: "cadence_eda",
    title: "Cadence EDA (Master / MAX)",
    blurb: "Industry signoff suite: Genus, Innovus, Voltus, Tempus, and Conformal LEC.",
  },
  {
    id: "synopsys_eda",
    title: "Synopsys EDA",
    blurb: "Production silicon flow: Design Compiler, IC Compiler II, PrimePower, PrimeTime, and Formality.",
  },
  {
    id: "opensource_eda",
    title: "Open-Source EDA",
    blurb: "Open silicon toolchain: Yosys, OpenROAD, OpenLane, PSM, OpenSTA, and Formal Equivalence.",
  },
];

export type LearnTrack = {
  id: string;
  group: LearnGroupId;
  title: string;
  blurb: string;
  accent: string;
};

export const LEARN_TRACKS: LearnTrack[] = [
  {
    id: "digital",
    group: "digital",
    title: "Digital design",
    blurb: "Combinational and sequential building blocks, FSMs, and timing intuition.",
    accent: "sky",
  },
  {
    id: "verilog",
    group: "hdl",
    title: "Verilog",
    blurb: "Modules, combo vs sequential, and coding problems like LeetCode.",
    accent: "emerald",
  },
  {
    id: "sv",
    group: "hdl",
    title: "SystemVerilog",
    blurb: "always_ff, interfaces, and the synthesizable SV subset.",
    accent: "teal",
  },
  {
    id: "synthesis",
    group: "synthesis",
    title: "RTL synthesis",
    blurb: "Elaborate, map, optimize — what Genus/DC actually do.",
    accent: "amber",
  },
  {
    id: "sdc",
    group: "constraints",
    title: "SDC constraints",
    blurb: "Clocks, I/O budgets, exceptions — write the Tcl yourself.",
    accent: "cyan",
  },
  {
    id: "mmmc",
    group: "constraints",
    title: "MMMC",
    blurb: "Modes, corners, libraries, and view matrices.",
    accent: "indigo",
  },
  {
    id: "sta",
    group: "timing",
    title: "Static timing",
    blurb: "Setup/hold, slack, path groups, and report reading.",
    accent: "yellow",
  },
  {
    id: "cdc",
    group: "timing",
    title: "CDC & clocks",
    blurb: "Async crossings, synchronizers, and clock groups.",
    accent: "lime",
  },
  {
    id: "upf",
    group: "power",
    title: "Power format (UPF)",
    blurb: "Domains, isolation, retention, and power states.",
    accent: "rose",
  },
  {
    id: "verification",
    group: "verification",
    title: "Verification",
    blurb: "Directed tests, constrained random, and coverage.",
    accent: "violet",
  },
  {
    id: "uvm",
    group: "verification",
    title: "UVM",
    blurb: "Components, phases, sequences — the standard TB library.",
    accent: "fuchsia",
  },
  {
    id: "tcl",
    group: "scripting",
    title: "Tcl",
    blurb: "The language behind SDC, PrimeTime, Innovus, and almost every EDA console.",
    accent: "cyan",
  },
  {
    id: "shell",
    group: "scripting",
    title: "Shell scripting",
    blurb: "Bash on the farm: grep, find, pipes, and batching reports.",
    accent: "lime",
  },
  {
    id: "gvim",
    group: "scripting",
    title: "GVim / Vim",
    blurb: "Navigate, search, substitute, and split — the PD editor of record.",
    accent: "yellow",
  },
  {
    id: "perl",
    group: "scripting",
    title: "Perl",
    blurb: "Regex, hashes, and line-oriented parsers for STA / log dumps.",
    accent: "rose",
  },
  {
    id: "python",
    group: "scripting",
    title: "Python",
    blurb: "Modern EDA glue: glob, re, and report harvesting.",
    accent: "indigo",
  },
  {
    id: "pdk",
    group: "formats",
    title: "PDK & EDA Formats",
    blurb: "LIB (NLDM/CCS/ECSM), LEF, QRC, TLUplus, SPEF, GDSII, CDL.",
    accent: "emerald",
  },
  {
    id: "xml",
    group: "formats",
    title: "XML",
    blurb: "IP-XACT, QOR dumps, namespaces, and XPath on tool reports.",
    accent: "cyan",
  },

  // ——— Cadence EDA (Strict Master / MAX) ———
  {
    id: "cadence-synthesis",
    group: "cadence_eda",
    title: "Synthesis (Genus)",
    blurb: "Logic synthesis, generic optimization, mapping, and iSpatial physical compile.",
    accent: "amber",
  },
  {
    id: "cadence-pnr",
    group: "cadence_eda",
    title: "Physical Design (Innovus)",
    blurb: "Floorplan, PDN, analytical placement, CCOpt CTS, and NanoRoute.",
    accent: "amber",
  },
  {
    id: "cadence-power",
    group: "cadence_eda",
    title: "Power Analysis (Voltus)",
    blurb: "Power Grid Views, static & vector-based dynamic IR drop, and EM signoff.",
    accent: "amber",
  },
  {
    id: "cadence-sta",
    group: "cadence_eda",
    title: "Static Timing Analysis (Tempus)",
    blurb: "MMMC timing closure, crosstalk SI glitch analysis, PBA, and signoff ECOs.",
    accent: "amber",
  },
  {
    id: "cadence-lec",
    group: "cadence_eda",
    title: "Logic Equivalence Checking (Conformal)",
    blurb: "Golden vs revised netlist proofs, DFF mapping, and formal ECO debug.",
    accent: "amber",
  },

  // ——— Synopsys EDA ———
  {
    id: "synopsys-synthesis",
    group: "synopsys_eda",
    title: "Synthesis (Design Compiler)",
    blurb: "GTECH elaboration, compile_ultra, automated clock gating, and SVF generation.",
    accent: "violet",
  },
  {
    id: "synopsys-pnr",
    group: "synopsys_eda",
    title: "Physical Design (IC Compiler II)",
    blurb: "NDM database, PNS power mesh, place_opt, NDR clock rules, and route_opt.",
    accent: "violet",
  },
  {
    id: "synopsys-power",
    group: "synopsys_eda",
    title: "Power Analysis (PrimePower)",
    blurb: "Time-based & averaged power, VCD/SAIF activity annotation, and rail analysis.",
    accent: "violet",
  },
  {
    id: "synopsys-sta",
    group: "synopsys_eda",
    title: "Static Timing Analysis (PrimeTime)",
    blurb: "DMSA multi-scenario analysis, PT-SI crosstalk, PBA, and fix_eco_timing.",
    accent: "violet",
  },
  {
    id: "synopsys-lec",
    group: "synopsys_eda",
    title: "Logic Equivalence Checking (Formality)",
    blurb: "Container setup (r: and i:), SVF guidance processing, and formal verification.",
    accent: "violet",
  },

  // ——— Open-Source EDA ———
  {
    id: "opensource-synthesis",
    group: "opensource_eda",
    title: "Synthesis (Yosys & ABC)",
    blurb: "AST elaboration, proc/opt/fsm passes, and technology mapping via ABC.",
    accent: "emerald",
  },
  {
    id: "opensource-pnr",
    group: "opensource_eda",
    title: "Physical Design (OpenROAD)",
    blurb: "Floorplanning, tapcells, RePlAce placement, TritonCTS, and TritonRoute.",
    accent: "emerald",
  },
  {
    id: "opensource-power",
    group: "opensource_eda",
    title: "Power Analysis (OpenROAD PSM)",
    blurb: "PDN resistance extraction, sparse matrix G*V=I, and static IR drop.",
    accent: "emerald",
  },
  {
    id: "opensource-sta",
    group: "opensource_eda",
    title: "Static Timing Analysis (OpenSTA)",
    blurb: "Liberty interpolation, SDC constraints, propagated clocks, and slack reports.",
    accent: "emerald",
  },
  {
    id: "opensource-lec",
    group: "opensource_eda",
    title: "Logic Equivalence Checking (Formal)",
    blurb: "Miter circuit generation, equiv_simple, and equiv_induct SAT proofs.",
    accent: "emerald",
  },
];

export const LEARN_KIND_ORDER: LearnKind[] = [
  "theory",
  "video",
  "practical",
  "quiz",
  "test",
];

export const LEARN_LAYER_ORDER: LearnLayer[] = [
  "beginner",
  "standard",
  "expert",
  "master",
];

export const LEARN_LAYER_META: Record<
  LearnLayer,
  { label: string; plan: "Free" | "Pro" | "Max"; hint: string }
> = {
  beginner: { label: "Beginner", plan: "Free", hint: "Foundations — free" },
  standard: { label: "Standard", plan: "Free", hint: "Working fluency — free" },
  expert: { label: "Expert", plan: "Pro", hint: "Production practice — Pro" },
  master: { label: "Master", plan: "Max", hint: "Signoff / methodology — Max" },
};

export function sessionLayer(s: LearnSession): LearnLayer {
  if (s.layer) return s.layer;
  if (s.difficulty === "easy" || s.level === "foundations") return "beginner";
  if (s.difficulty === "hard" || s.level === "advanced") return "expert";
  if (s.kind === "test") return "expert";
  return "standard";
}

export const LEARN_KIND_META: Record<
  LearnKind,
  { label: string; badge: string; hubLabel: string }
> = {
  theory: { label: "Theory", badge: "THEORY", hubLabel: "Theory" },
  video: { label: "Video", badge: "VIDEO", hubLabel: "Videos" },
  practical: { label: "Practical", badge: "PRACTICAL", hubLabel: "Practicals" },
  quiz: { label: "Quiz", badge: "QUIZ", hubLabel: "Quizzes" },
  test: { label: "Test", badge: "TEST", hubLabel: "Tests" },
};

const LEARN_SESSION_CORE: LearnSession[] = [
  // ——— Digital design (Beginner Layer) ———
  {
    slug: "digital-intro",
    track: "digital",
    kind: "theory",
    layer: "beginner",
    title: "Introduction to Digital Design & the Silicon Stack",
    minutes: 22,
    level: "foundations",
    summary: "Bits, voltage thresholds, noise margins, and the flow from RTL to GDSII.",
    body: [
      `## What "digital" actually is

A chip is not software. It is a **graph of gates** (combinational) plus **storage** (sequential). Gates compute a Boolean function the instant their inputs change. Flip-flops remember a bit until the next clock edge.

FLOW: Spec → RTL → Sim → Synthesis → Place → CTS → Route → STA → DRC/LVS → GDSII

## Combinational vs sequential

COMPARE Building blocks
Property | Combinational | Sequential
---
Memory | None | Flip-flops / latches / SRAM
Clock | Not required | Required (except async logic)
Example | Mux, adder, decoder | Counter, FSM, pipeline
Verilog | \`always @(*)\` / \`assign\` | \`always @(posedge clk)\`
If you omit a branch | Infers a **latch** | Holds previous Q
ENDCOMPARE

- Combinational: output is a pure function of current inputs.
- Sequential: output also depends on stored state.

## A bit is a voltage band, not a math symbol

TABLE Voltage levels (CMOS)
Name | Meaning
---
VDD | Supply (logic-high rail)
GND / VSS | Ground (logic-low rail)
VOL / VOH | Guaranteed output low / high
VIL / VIH | Maximum input still read as 0 / minimum still read as 1
NML | Noise margin low = VIL − VOL
NMH | Noise margin high = VOH − VIH
ENDTABLE

NOTE: If noise eats the margin, a 1 can be sampled as 0. That is why we care about noise margins in I/O and on long on-chip nets.

## Number systems you will type every day

TABLE
Base | Digits | Verilog literal | Example
---
Binary | 0 1 | \`4'b1101\` | 13
Hex | 0–F | \`8'hA5\` | 165
Decimal | 0–9 | \`8'd42\` | 42
Two's complement | signed binary | \`8'shFB\` | −5
ENDTABLE

Q: Why do we write \`8'hA5\` instead of just 165?
A: The width (8) is part of the hardware. A bare 165 is an integer; a sized literal is a bus.

Q: What happens if you mix signed and unsigned in Verilog?
A: The whole expression becomes unsigned. \`-5 + 8'd2\` is not −3 — it is a huge unsigned number. Cast with \`$signed()\`.

## Vocabulary checklist

- Mux: steer one of 2^N inputs with N select bits
- Decoder: N bits → 2^N one-hot
- Full adder: Sum = A ⊕ B ⊕ Cin, Cout = majority
- FSM: state register + next-state combo + outputs
- HDL: human-readable hardware that synthesis maps to standard cells
`,
    ],
    checklist: [
      "Combinational logic has no internal state or clock dependency.",
      "Sequential logic uses clock edges to synchronize data movement.",
      "Noise margins guarantee immunity against voltage supply fluctuations.",
      "Synthesis translates human-written RTL into an optimized gate-level netlist.",
    ],
  },
  {
    slug: "digital-combo",
    track: "digital",
    kind: "theory",
    layer: "beginner",
    title: "Combinational Building Blocks & Logic Gates",
    minutes: 16,
    level: "foundations",
    summary: "Gates, multiplexers, decoders, encoders, and full adders without unintended latches.",
    body: [
      "Fundamental Logic Gates: AND, OR, NOT, NAND, NOR, XOR, XNOR. NAND and NOR gates are universal gates in CMOS because they can be implemented with a single pull-up and pull-down network without requiring an output inverter.",
      "Multiplexers & Decoders: A multiplexer (Mux) selects 1 of 2^N inputs using N select lines. A decoder converts an N-bit binary code into 2^N one-hot active lines. Priority encoders encode the index of the highest-priority active input line.",
      "Binary Arithmetic: A Half Adder sums 2 bits producing Sum (A ^ B) and Carry (A & B). A Full Adder adds 3 bits (A, B, Cin) producing Sum = A ^ B ^ Cin and Cout = (A & B) | (Cin & (A ^ B)). Cascading full adders creates a Ripple Carry Adder (RCA).",
      "Avoiding Latch Traps: In combinational always @(*) blocks, if a variable is not assigned a value in every possible if/else or case branch, the synthesis tool must preserve its previous value, inferring a level-sensitive transparent latch. Always assign default values at the top of the block or cover all branches.",
    ],
    code: {
      title: "mux4_clean.v",
      lang: "verilog",
      source: `module mux4 (
  input  wire [3:0] in,
  input  wire [1:0] sel,
  output reg        out
);
  always @(*) begin
    case (sel)
      2'b00: out = in[0];
      2'b01: out = in[1];
      2'b10: out = in[2];
      2'b11: out = in[3];
      default: out = 1'b0; // Prevents latch inference
    endcase
  end
endmodule`,
    },
    checklist: [
      "Cover all branches in combinational always @(*) blocks to prevent inferred latches.",
      "NAND and NOR are CMOS universal building blocks.",
      "Full Adder: Sum = A ^ B ^ Cin, Cout = (A & B) | (Cin & (A ^ B)).",
    ],
  },
  {
    slug: "digital-seq",
    track: "digital",
    kind: "theory",
    layer: "beginner",
    title: "Sequential Storage: Latches, Flip-Flops & Registers",
    minutes: 18,
    level: "foundations",
    summary: "Level-sensitive latches vs. edge-triggered D flip-flops, resets, and shift registers.",
    body: [
      "Level-Sensitive Latch vs. Edge-Triggered Flip-Flop: A D-latch is transparent while enable is HIGH (output follows input) and opaque while enable is LOW. A D Flip-Flop is composed of two latches in master-slave configuration, sampling data D strictly on the rising or falling clock edge.",
      "Setup & Hold Aperture: For reliable capture, data D must remain stable for a setup time (Tsetup) before the clock edge, and must remain stable for a hold time (Thold) after the clock edge.",
      "Reset Strategies: Asynchronous reset (if (!rst_n) in sensitivity list) forces the flip-flop to its reset state immediately, independent of the clock. Synchronous reset waits for the next active clock edge before clearing Q. ASICs commonly use asynchronous assertion with synchronous deassertion.",
      "Shift Registers & Ripple Counters: Connecting the Q output of one flop to the D input of the next creates a shift register. Toggling a T-flip-flop or connecting Q_bar back to D divides the clock frequency by 2, creating binary ripple counters.",
    ],
    code: {
      title: "dff_async_rst.v",
      lang: "verilog",
      source: `module dff_async_rst (
  input  wire clk,
  input  wire rst_n,
  input  wire d,
  output reg  q
);
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) q <= 1'b0;
    else        q <= d;
  end
endmodule`,
    },
    checklist: [
      "Edge-triggered flip-flops prevent combinational feedback race conditions.",
      "Never violate setup or hold aperture around the clock edge.",
      "Include async reset in the always sensitivity list; sync reset belongs inside the clock branch.",
    ],
  },
  {
    slug: "digital-video",
    track: "digital",
    kind: "video",
    layer: "beginner",
    title: "Combinational circuit design",
    minutes: 52,
    level: "foundations",
    summary: "NPTEL (IIT Madras): combinational building blocks before you write RTL.",
    youtubeId: "uv_RJ1Pv71s",
    youtubeTitle: "Lecture 2 — Combinational Circuit Design — NPTEL Digital VLSI System Design",
    body: ["Watch, then take the quiz. Verilog modeling of the same blocks is the next course."],
  },
  {
    slug: "digital-quiz",
    track: "digital",
    kind: "quiz",
    layer: "beginner",
    title: "Digital Design — Beginner Foundations Quiz",
    minutes: 8,
    level: "foundations",
    passMark: 70,
    summary: "Gates, flip-flops, latches, and FSM fundamentals.",
    body: ["Five questions testing core foundational concepts."],
    questions: [
      {
        id: "d1",
        prompt: "Combinational logic output is a function of:",
        choices: ["Past states and clock count", "Current inputs only with no memory", "Clock frequency", "Always a transparent latch"],
        answer: 1,
        explain: "Combinational circuits have no memory or feedback storage; outputs depend purely on present inputs.",
      },
      {
        id: "d2",
        prompt: "A D flip-flop updates its output Q:",
        choices: ["Continuously while clock is high", "Strictly on the active clock transition edge", "Only when reset is asserted", "Whenever input D toggles"],
        answer: 1,
        explain: "Flip-flops are edge-triggered; latches are level-sensitive.",
      },
      {
        id: "d3",
        prompt: "In a Moore Finite State Machine, the output depends on:",
        choices: ["Only the current state", "Both current state and current inputs", "The clock jitter", "The synthesis tool version"],
        answer: 0,
        explain: "Moore outputs depend strictly on state registers. Mealy outputs depend on state + inputs.",
      },
      {
        id: "d4",
        prompt: "An unassigned branch in a combinational always @(*) block results in:",
        choices: ["A flip-flop", "An unintended transparent latch", "A clock buffer", "A DRC error"],
        answer: 1,
        explain: "The synthesis tool infers a latch to preserve output state when branches are incomplete.",
      },
      {
        id: "d5",
        prompt: "An asynchronous active-low reset signal must be specified in Verilog inside:",
        choices: ["The assign continuous statement", "The always sensitivity list (e.g. posedge clk or negedge rst_n)", "Only in the SDC timing constraints file", "Never in RTL"],
        answer: 1,
        explain: "Listing negedge rst_n in the sensitivity list makes the reset asynchronous to the clock.",
      },
    ],
  },

  // ——— SystemVerilog ———
  {
    slug: "sv-intro",
    track: "sv",
    kind: "theory",
    title: "Introduction to SystemVerilog",
    minutes: 22,
    level: "working",
    layer: "beginner",
    summary: "logic, always_ff / always_comb, packed types — the synthesizable subset.",
    body: [
      `## Why SystemVerilog for RTL

Verilog works. SV makes the **intent** obvious so the tool can yell when you lie.

COMPARE Verilog vs SystemVerilog (RTL)
Job | Verilog | SystemVerilog
---
Net or variable | \`wire\` vs \`reg\` confusion | \`logic\`
Combo process | \`always @(*)\` | \`always_comb\` (error on latch)
Seq process | \`always @(posedge clk)\` | \`always_ff @(posedge clk)\`
Intentional latch | hidden in incomplete if | \`always_latch\`
FSM states | \`parameter IDLE = 0\` | \`typedef enum logic [1:0] {IDLE, RUN, DONE} state_t\`
Bundle | long port lists | \`interface\` + \`modport\`
ENDCOMPARE

FLOW: logic ports → always_ff (state) → always_comb (next / out) → unique case

## The two processes

CODE verilog
always_ff @(posedge clk or negedge rst_n) begin
  if (!rst_n) q <= 1'b0;
  else        q <= d;
end

always_comb begin
  y = sel ? a : b;
end
ENDCODE

- \`<=\` inside \`always_ff\`
- \`=\` inside \`always_comb\`
- Do not mix.

Q: What if \`always_comb\` infers a latch?
A: The compiler should error. That is the point. Fix the combo — don't switch to \`always_latch\` unless you meant a latch.

TABLE Packed vs unpacked
Kind | Example | Hardware
---
packed struct | \`typedef struct packed {logic [7:0] a,b;} t;\` | one bit vector
unpacked array | \`logic [7:0] mem [0:255];\` | memory / list of words
ENDTABLE

NOTE: Interfaces are great on SoC boundaries. Leaf RTL can stay simple ports if your synthesizer is old.
`,
    ],
    code: {
      title: "dff.sv",
      lang: "verilog",
      source: `module dff (
  input  logic clk, rst_n, d,
  output logic q
);
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) q <= 1'b0;
    else        q <= d;
  end
endmodule`,
    },
  },
  {
    slug: "sv-sva",
    track: "sv",
    kind: "theory",
    title: "Assertions (SVA) in brief",
    minutes: 14,
    level: "working",
    layer: "beginner",
    summary: "Immediate vs concurrent asserts — catch FSM illegal states in sim.",
    body: [
      "Immediate assertion: assert (ready !== 1'bx); checked when the procedural statement runs. Concurrent: assert property (@(posedge clk) req |-> ##[1:3] ack); lives in time.",
      "A failed assertion is a log line you actually read. Put them on protocols, one-hot FSMs, and 'this pulse is a single cycle'.",
      "Synthesis usually ignores (or errors on) concurrent SVA. Keep them in sim-only blocks (\`ifdef SIM) if the flow is strict.",
    ],
  },
  {
    slug: "sv-video",
    track: "sv",
    kind: "video",
    title: "Interfaces and bus models",
    minutes: 5,
    level: "working",
    layer: "beginner",
    summary: "UVM Primer ch.3 — SystemVerilog interfaces as the TB/DUT contract.",
    youtubeId: "53vDSE-CQ3I",
    youtubeTitle: "Chapter 3: SystemVerilog Interfaces and Bus Functional Models — The UVM Primer",
    body: ["Short. Then write an always_ff flop in the practical."],
  },
  {
    slug: "sv-ff-practical",
    track: "sv",
    kind: "practical",
    title: "always_ff D-flop",
    minutes: 10,
    level: "foundations",
    layer: "beginner",
    difficulty: "easy",
    summary: "SystemVerilog sequential process with async reset.",
    body: ["Use always_ff, logic q, nonblocking <=."],
    checklist: [
      "always_ff @(posedge clk or negedge rst_n).",
      "logic (not only reg) is fine.",
      "q <= d on the clock.",
    ],
    problem: {
      language: "verilog",
      starter: `module dff_sv (
  input  logic clk,
  input  logic rst_n,
  input  logic d,
  output logic q
);
  // TODO: always_ff async-reset DFF

endmodule
`,
      checks: [
        { id: "ff", label: "always_ff present", kind: "includes", pattern: "always_ff" },
        { id: "pe", label: "posedge clk", kind: "includes", pattern: "posedge clk" },
        { id: "nba", label: "q <=", kind: "regex", pattern: "q\\s*<=" },
        { id: "rst", label: "mentions rst_n", kind: "includes", pattern: "rst_n" },
      ],
      solution: `module dff_sv (
  input  logic clk,
  input  logic rst_n,
  input  logic d,
  output logic q
);
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) q <= 1'b0;
    else        q <= d;
  end
endmodule
`,
    },
  },
  {
    slug: "sv-quiz",
    track: "sv",
    kind: "quiz",
    title: "SystemVerilog quiz",
    minutes: 8,
    level: "working",
    layer: "beginner",
    passMark: 70,
    summary: "always_ff vs always_comb, logic, SVA.",
    body: ["Five questions."],
    questions: [
      {
        id: "sv1",
        prompt: "always_ff is for:",
        choices: ["Combo only", "Sequential (clocked) processes", "UDP", "Specify blocks"],
        answer: 1,
        explain: "The SV sequential process. Combo is always_comb.",
      },
      {
        id: "sv2",
        prompt: "always_comb that infers a latch typically:",
        choices: ["Is silent", "Is a tool error/warning — that is the point", "Makes a flop", "Is required"],
        answer: 1,
        explain: "Stricter than Verilog always @(*).",
      },
      {
        id: "sv3",
        prompt: "logic can replace:",
        choices: ["Only integer", "Most wire/reg in RTL", "A clock generator", "SDF"],
        answer: 1,
        explain: "One type for nets and variables in the SV subset.",
      },
      {
        id: "sv4",
        prompt: "A concurrent assertion is checked:",
        choices: ["Once at time 0", "Over time against a clocking event", "Only in synthesis", "Never"],
        answer: 1,
        explain: "assert property (@(posedge clk) ...).",
      },
      {
        id: "sv5",
        prompt: "An interface is primarily:",
        choices: ["A timing arc", "A bundle of signals (and modports) between blocks", "A UPF domain", "A .lib cell"],
        answer: 1,
        explain: "The SV port bundle.",
      },
    ],
  },

  // ——— RTL synthesis (Beginner Layer) ———
  {
    slug: "synth-intro",
    track: "synthesis",
    kind: "theory",
    layer: "beginner",
    title: "Introduction to RTL Synthesis & Compilation Pipeline",
    minutes: 18,
    level: "working",
    summary: "Elaboration → GTECH → Technology Mapping → Optimization under SDC constraints.",
    body: [
      "The Synthesis Flow Pipeline: Synthesis transforms behavioral Verilog/SystemVerilog RTL into a target technology gate-level netlist. The 4 major phases are: 1) **Analyze/Elaborate** (syntax parsing, parameter binding, and macro expansion into GTECH unmapped logic), 2) **Generic Optimization** (Boolean minimization and constant folding), 3) **Technology Mapping** (binding GTECH gates to real standard cells from target `.lib` libraries), and 4) **Timing/Area Optimization** (sizing cells, inserting buffers, and structuring logic cones to meet SDC clock requirements).",
      "Inputs to Synthesis: A complete synthesis compilation run requires three foundational inputs: 1) Synthesizable RTL source files, 2) Target Technology Libraries (`.lib` standard cell timing and power models), and 3) Design Constraints (`.sdc` defining clock definitions, I/O delays, and false paths).",
      "Essential Synthesis Reports: Key reports produced during compilation: `report_qor` (Worst Negative Slack WNS, Total Negative Slack TNS, cell count, and total silicon area), `report_timing` (critical path breakdown with cell delay and net delay), `report_area`, and `check_design` (flags inferred latches, multi-driven nets, and unmapped logic).",
      "Synthesis Timing vs. Signoff STA: Pre-layout synthesis timing estimates rely on Wire Load Models (WLM) or early topographical floorplan placement. Signoff STA occurs post-placement and route after Clock Tree Synthesis (CTS) with extracted SPEF parasitic RC values.",
    ],
    code: {
      title: "synth_basic.tcl",
      lang: "tcl",
      source: `# Basic Design Compiler / Genus Synthesis Script
set_app_var target_library "sky130_fd_sc_hd__tt_025C_1v80.db"
set_app_var link_library   "* sky130_fd_sc_hd__tt_025C_1v80.db"

# 1. Read & Elaborate RTL
read_verilog -sv {alu.v datapath.v}
elaborate top_alu

# 2. Apply SDC Constraints
read_sdc constraints.sdc

# 3. Compile & Optimize to Gates
compile_ultra -gate_clock

# 4. Generate Reports
report_qor > qor_summary.rpt
report_timing -max_paths 10 > timing_critical.rpt
write_verilog -output gate_netlist.v`,
    },
  },
  {
    slug: "synth-gtech-lib",
    track: "synthesis",
    kind: "theory",
    layer: "beginner",
    title: "Standard Cell Libraries (.lib), NLDM vs CCS vs ECSM & PDK Formats",
    minutes: 18,
    level: "working",
    summary: "Understanding Liberty timing architectures (NLDM, CCS, ECSM), LEF abstracts, QRC extraction, and PDK files.",
    body: [
      "The Liberty (.lib) Standard: Defines standard cell electrical timing, leakage power, and dynamic internal switching energy. Characterized using SPICE circuit simulations across PVT extremes.",
      "The 3 Major Cell Delay Models: 1) **NLDM (Non-Linear Delay Model)**: 2D LUT table lookup based on Thevenin voltage ramp. Accurate for >65nm, but fails in FinFET due to resistive wire shielding and Miller capacitance; 2) **CCS (Composite Current Source - Synopsys)**: Time-varying current sources $I(t)$ with dynamic receiver capacitance ($C_1/C_2$) providing <1.5% SPICE accuracy; 3) **ECSM (Effective Current Source Model - Cadence)**: Voltage-dependent current sources with multi-threshold transition waveforms $V(t)$.",
      "PDK Physical & Parasitic Formats: **Tech LEF** defines routing layers, pitches, and DRC design rules; **Macro LEF** provides cell boundary footprints, pin coordinates, and routing obstructions (`OBS`); **QRC / TLUplus** contains dielectric permittivity ($\kappa$) and metal sheet resistance tables for 3D field-solver parasitic extraction; **SPEF** stores the extracted distributed $\Pi$-model RC netlist; **GDSII** contains full binary mask polygons for foundry fabrication.",
      "Cell Sizing & Drive Strengths: Libraries offer multiple drive strength variants (e.g. `INV_X1`, `INV_X2`, `INV_X4`, `INV_X8`). Sizing up a gate reduces internal propagation delay and boosts output slew, but increases input pin capacitance on the driving stage.",
    ],
  },
  {
    slug: "synth-video",
    track: "synthesis",
    kind: "video",
    layer: "beginner",
    title: "RTL Synthesis Principles & Tool Architecture",
    minutes: 55,
    level: "working",
    summary: "NPTEL VLSI Design Flow: RTL to GDS — synthesis lecture covering elaboration and mapping.",
    youtubeId: "cnpWgZLgB4I",
    youtubeTitle: "RTL Synthesis — Part I — NPTEL VLSI Design Flow: RTL to GDS",
    body: ["Watch the lecture to understand the mathematics behind Boolean minimization and standard cell technology mapping."],
  },
  {
    slug: "synth-beginner-practical",
    track: "synthesis",
    kind: "practical",
    layer: "beginner",
    title: "Beginner Practical: Synthesizable Arithmetic Unit & Gate Analysis",
    minutes: 18,
    level: "foundations",
    difficulty: "easy",
    summary: "Write a clean synthesizable ALU with complete conditional branches to ensure zero unintended latches.",
    body: [
      "In synthesizable RTL, missing branches in `always @*` or unassigned signals on certain opcode decode conditions cause synthesis tools to infer unwanted transparent latches (`GTECH_LATCH`).",
      "Implement module `synth_alu` with opcodes: `ADD (2'b00)`, `SUB (2'b01)`, `AND (2'b10)`, `OR (2'b11)` ensuring every path assigns output `result` with zero latches.",
    ],
    checklist: [
      "Declare module `synth_alu` with 2-bit `opcode`, two 8-bit inputs `a, b`, and 8-bit output `result`.",
      "Implement pure combinational logic using `always @(*)` or `always_comb`.",
      "Assign default `result = 8'h00` or specify all 4 opcode cases completely.",
      "Support ADD (`a + b`), SUB (`a - b`), AND (`a & b`), and OR (`a | b`)."
    ],
    problem: {
      language: "verilog",
      starter: `module synth_alu (
  input  wire [1:0] opcode,
  input  wire [7:0] a,
  input  wire [7:0] b,
  output reg  [7:0] result
);

  // TODO: Implement synthesizable ALU logic with complete case coverage

endmodule`,
      checks: [
        { id: "mod", label: "Module declaration", kind: "includes", pattern: "module synth_alu" },
        { id: "op", label: "Opcode evaluation", kind: "includes", pattern: "opcode" },
        { id: "add", label: "Addition operation", kind: "regex", pattern: "a\\s*\\+\\s*b" },
        { id: "sub", label: "Subtraction operation", kind: "regex", pattern: "a\\s*\\-\\s*b" },
        { id: "combo", label: "Combinational always", kind: "regex", pattern: "always\\s*@|always_comb" },
      ],
      solution: `module synth_alu (
  input  wire [1:0] opcode,
  input  wire [7:0] a,
  input  wire [7:0] b,
  output reg  [7:0] result
);

  always @(*) begin
    case (opcode)
      2'b00:   result = a + b;
      2'b01:   result = a - b;
      2'b10:   result = a & b;
      2'b11:   result = a | b;
      default: result = 8'h00;
    endcase
  end

endmodule`,
    },
  },
  {
    slug: "synth-quiz",
    track: "synthesis",
    kind: "quiz",
    layer: "beginner",
    title: "RTL Synthesis Foundations Quiz",
    minutes: 8,
    level: "working",
    passMark: 70,
    summary: "Synthesis compilation stages, technology mapping, and .lib models.",
    body: ["Four questions."],
    questions: [
      {
        id: "sy1",
        prompt: "Synthesis requires at minimum what three inputs?",
        choices: ["GDS layout, DEF, SPEF", "Synthesizable RTL, target technology library (.lib), and SDC timing constraints", "Testbench, VCD waveforms, and coverage log", "UPF power script only"],
        answer: 1,
        explain: "Synthesis reads RTL, targets standard cell models from .lib, and optimizes under SDC constraints.",
      },
      {
        id: "sy2",
        prompt: "In synthesis terminology, 'Technology Mapping' refers to:",
        choices: ["Placing hard macros on the floorplan", "Binding generic logic gates (GTECH) to standard cells in the target .lib", "Routing metal interconnects", "Writing SVA assertions"],
        answer: 1,
        explain: "Technology mapping matches generic Boolean trees to concrete standard cell gates in the target technology library.",
      },
      {
        id: "sy3",
        prompt: "Why should an RTL designer avoid '#5' delay statements in synthesizable code?",
        choices: ["Delays are completely ignored by synthesis tools and create simulation-synthesis mismatches", "Delays force the tool to insert 5ns physical delay buffers", "Delays are forbidden by the IEEE Verilog standard", "Delays cause gate oxide breakdown"],
        answer: 0,
        explain: "Procedural delays (#) cannot be synthesized into static logic; hardware timing is governed by physical gate delays and SDC constraints.",
      },
      {
        id: "sy4",
        prompt: "An unassigned output branch in an 'always @(*)' block causes synthesis tools to infer:",
        choices: ["A pipeline flip-flop", "An unwanted transparent latch (GTECH_LATCH)", "A pull-up resistor", "An asynchronous clock domain crossing"],
        answer: 1,
        explain: "When an output is not assigned under all conditional paths, the hardware must hold its previous value, forcing the tool to synthesize a latch.",
      },
    ],
  },

  // ——— Verification ———
  {
    slug: "verif-intro",
    track: "verification",
    kind: "theory",
    title: "Introduction to verification",
    minutes: 16,
    level: "working",
    summary: "Directed tests, constrained random, coverage — why 'it simulated' is not 'it is correct'.",
    body: [
      "Verification asks: does this RTL match the spec? Simulation is the workhorse. Formal proves properties. Equivalence (LEC) checks two netlists.",
      "A testbench drives the DUT, samples outputs, and checks. Directed tests hit known cases. Constrained-random explores the space you forgot. Coverage (code and functional) tells you what you never stimulated.",
      "Scoreboard: predict expected, compare. Monitor: observe a bus without driving it. Checker: assertion or software compare.",
      "Pass/fail must be automatic. 'I stared at the waveform' does not scale. Dump waves for debug after a check fires.",
    ],
  },
  {
    slug: "verif-video",
    track: "verification",
    kind: "video",
    title: "A conventional testbench",
    minutes: 9,
    level: "working",
    summary: "UVM Primer ch.2 — the TB you write before you wrap it in UVM.",
    youtubeId: "iX7-41uG8uE",
    youtubeTitle: "Chapter 2: Conventional Testbench for the TinyALU — The UVM Primer",
    body: ["This is the mental model UVM later components."],
  },
  {
    slug: "verif-quiz",
    track: "verification",
    kind: "quiz",
    title: "Verification quiz",
    minutes: 8,
    level: "working",
    passMark: 70,
    summary: "TB roles and coverage.",
    body: ["Four questions."],
    questions: [
      {
        id: "vf1",
        prompt: "Functional coverage tells you:",
        choices: ["Area", "Which specified scenarios actually occurred in sim", "WNS", "DRC"],
        answer: 1,
        explain: "Code coverage is lines/toggles; functional is the spec bins you wrote.",
      },
      {
        id: "vf2",
        prompt: "A scoreboard:",
        choices: ["Places the design", "Predicts expected outputs and compares to DUT", "Writes SDC", "Is a clock"],
        answer: 1,
        explain: "The check, not the driver.",
      },
      {
        id: "vf3",
        prompt: "Constrained-random is useful because:",
        choices: ["It is slower", "It hits combinations you did not enumerate", "It replaces STA", "It is synthesis"],
        answer: 1,
        explain: "Directed tests still cover the must-hit cases.",
      },
      {
        id: "vf4",
        prompt: "LEC (logic equivalence) compares:",
        choices: ["Two layouts", "Two netlists/RTL for Boolean equivalence", "Two SPEFs", "Two UPF files"],
        answer: 1,
        explain: "Did synthesis or an ECO change function?",
      },
    ],
  },

  // ——— UVM ———
  {
    slug: "uvm-intro",
    track: "uvm",
    kind: "theory",
    title: "Introduction to UVM",
    minutes: 18,
    level: "advanced",
    summary: "uvm_component, phases, sequencer/driver/monitor, sequences.",
    body: [
      "UVM is a SystemVerilog class library. You do not invent a TB architecture each project: agent = sequencer + driver + monitor. Env contains agents + scoreboard. Test creates the env and starts sequences.",
      "Phases: build_phase (new components), connect_phase (Tlm ports), run_phase (time-consuming). Objection: raise/drop so run_phase knows when to end.",
      "A sequence is a reusable scenario (item stream). The sequencer arbitrates. The driver translates items to pin wiggles on a virtual interface.",
      "factory + config_db let a test swap a driver or set a vif without editing the env. That reuse is the point — not the boilerplate.",
      "Start with one agent and a directed sequence. Coverage and callbacks come after the first test actually finishes.",
    ],
    code: {
      title: "skeleton.svh",
      lang: "verilog",
      source: `class my_test extends uvm_test;
  \`uvm_component_utils(my_test)
  my_env env;
  function void build_phase(uvm_phase phase);
    env = my_env::type_id::create("env", this);
  endfunction
  task run_phase(uvm_phase phase);
    my_seq seq = my_seq::type_id::create("seq");
    phase.raise_objection(this);
    seq.start(env.agent.sqr);
    phase.drop_objection(this);
  endtask
endclass`,
    },
  },
  {
    slug: "uvm-video",
    track: "uvm",
    kind: "video",
    title: "Introduction to UVM",
    minutes: 4,
    level: "working",
    summary: "Systemverilog Academy — why UVM exists, in minutes.",
    youtubeId: "aUwX6iioHR4",
    youtubeTitle: "L2.1 : Introduction to UVM — Systemverilog Academy",
    body: ["Then read the component diagram in the theory page again."],
  },
  {
    slug: "uvm-quiz",
    track: "uvm",
    kind: "quiz",
    title: "UVM quiz",
    minutes: 8,
    level: "advanced",
    passMark: 70,
    summary: "Agents, phases, objections.",
    body: ["Five questions."],
    questions: [
      {
        id: "u1",
        prompt: "A typical UVM agent contains:",
        choices: ["Only a DUT", "Sequencer, driver, and monitor", "A compiler", "An SDC file"],
        answer: 1,
        explain: "Active agents drive; passive agents monitor only.",
      },
      {
        id: "u2",
        prompt: "build_phase is for:",
        choices: ["Driving pins", "Constructing child components", "Place-and-route", "Writing SPEF"],
        answer: 1,
        explain: "connect_phase wires TLM; run_phase consumes time.",
      },
      {
        id: "u3",
        prompt: "raise/drop objection:",
        choices: ["Kills the simulator immediately", "Tells UVM when run_phase work is still outstanding", "Compiles RTL", "Sets the clock"],
        answer: 1,
        explain: "When all objections drop, the phase ends.",
      },
      {
        id: "u4",
        prompt: "A sequence produces:",
        choices: ["GDS", "Transaction items for the driver", "Liberty cells", "Clock groups"],
        answer: 1,
        explain: "The sequencer is the mailbox; the driver is the BFM.",
      },
      {
        id: "u5",
        prompt: "config_db is used to:",
        choices: ["Store SPEF", "Pass configuration (e.g. virtual interface) down the hierarchy", "Run STA", "Write UPF"],
        answer: 1,
        explain: "Tests set; components get.",
      },
    ],
  },

  // ——— Tcl ———
  {
    slug: "tcl-theory",
    track: "tcl",
    kind: "theory",
    title: "Tcl the EDA engineer actually uses",
    minutes: 24,
    level: "foundations",
    summary: "Words, lists, quoting, foreach, proc, and why [ ] vs { } vs \" \" matters in SDC.",
    body: [
      `## Tcl is a language first, an EDA console second

Every command is: **command arg1 arg2 ...**. SDC is Tcl: \`create_clock\` is just a command the STA tool implements.

FLOW: tokenize line → substitute $ and [] → run command → return a string

## The three quoting rules (memorize these)

COMPARE Quoting
Syntax | Substitutes \`$var\` | Substitutes \`[cmd]\` | Use for
---
\`{ hello $x }\` | No | No | Literal lists, script bodies, \`expr\`
\`"hello $x"\` | Yes | Yes | Messages, file names with vars
bareword | Yes | Yes | Simple tokens with no spaces
\`[get_ports clk]\` | n/a | Runs the command | Splice a result into the line
ENDCOMPARE

WARN: \`set period 1000/$freq\` is string concat, not math. Always \`set period [expr {1000.0 / $freq}]\`.

## Variables, keywords, conditions, loops

- **set** \`name value\` — create / update. Read with \`$name\`.
- **unset** / **info exists** — delete / test.
- **incr** \`x 1\` — integer bump.
- **if / elseif / else** — \`if {$x > 0} { ... } else { ... }\`
- **switch** — pattern dispatch.
- **for** — counted: \`for {set i 0} {$i < 4} {incr i} { ... }\`
- **foreach** — walk a list: \`foreach n $clocks { ... }\`
- **while** — \`while {$n > 0} { incr n -1 }\`
- **break / continue** — same idea as C.
- **proc** — user command: \`proc add {a b} { expr {$a + $b} }\`

TABLE Core commands
Command | What it does | Example
---
puts | Print | \`puts "WNS $wns"\`
expr | Math | \`expr {$a + $b}\`
list / lappend / lindex / llength | Lists | \`lindex $clocks 0\`
string equal / match / length | Strings | \`string match clk* $n\`
open / gets / close | Files | \`set fh [open t.rpt r]\`
catch | Trap errors | \`catch { open missing r } err\`
ENDTABLE

TRY tcl
set clocks {clk_core clk_periph}
set period 2.0
foreach n $clocks {
  puts "create_clock -name $n -period $period"
}
puts "count=[llength $clocks]"
ENDTRY

Q: Why braces around \`expr {$a + $b}\`?
A: So \`$a\` is substituted once, safely. Unbraced expr can double-substitute and is slower.

Q: Is a Tcl list a special binary type?
A: No. It is a string with list quoting. \`{clk_a clk_b}\` has two elements.

## EDA vs core Tcl (you need both)

- Core Tcl (this lab): \`foreach\`, \`llength\`, \`lindex\` — works everywhere, including this page.
- Tool collections (next lessons): \`foreach_in_collection\`, \`sizeof_collection\` — **do not** \`llength\` a PrimeTime collection handle.

COMPARE Where Tcl runs
Need | Synopsys | Cadence | Open source
---
Synthesis | dc_shell / fc_shell | genus | yosys
STA | pt_shell | tempus | sta (OpenSTA)
P&R | icc2_shell | innovus | openroad
ENDCOMPARE
`,
    ],
    code: {
      title: "foreach_clocks.tcl",
      lang: "tcl",
      source: `set clocks {clk_core clk_periph vclk_ext}
proc periods {names t} {
  foreach n $names {
    puts "create_clock -name $n -period $t"
  }
}
periods $clocks 2.0`,
    },
  },
  {
    slug: "tcl-video",
    track: "tcl",
    kind: "video",
    title: "Programming using Tcl/Tk",
    minutes: 56,
    level: "foundations",
    summary: "NPTEL (Anand Iyer): Tcl fundamentals aimed at IC-design scripting.",
    youtubeId: "Avdp-Uj3Qyc",
    youtubeTitle: "Programming Using Tcl/Tk-I — NPTEL Linux Programming & Scripting",
    body: [
      "Watch substitution and lists carefully — that is why SDC breaks when you forget braces.",
    ],
  },
  {
    slug: "tcl-foreach-practical",
    track: "tcl",
    kind: "practical",
    title: "proc + foreach over a clock list",
    minutes: 12,
    level: "foundations",
    difficulty: "easy",
    summary: "Write a proc that walks {clk_a clk_b clk_c} and prints a create_clock line each.",
    body: [
      "Define proc emit_clocks {names period}. foreach each name, puts a create_clock -name <n> -period <period> command.",
      "Call it with list clk_a clk_b clk_c and period 2.0.",
    ],
    checklist: [
      "proc named emit_clocks with two arguments.",
      "foreach over the names list.",
      "puts a create_clock line (substitution is fine).",
    ],
    problem: {
      language: "tcl",
      starter: `# emit_clocks {clk_a clk_b clk_c} 2.0
# should print three create_clock lines

`,
      checks: [
        { id: "proc", label: "defines proc emit_clocks", kind: "includes", pattern: "proc emit_clocks" },
        { id: "fe", label: "foreach over the names", kind: "includes", pattern: "foreach" },
        { id: "cc", label: "emits create_clock", kind: "includes", pattern: "create_clock" },
        { id: "per", label: "uses -period", kind: "includes", pattern: "-period" },
      ],
      solution: `proc emit_clocks {names period} {
  foreach n $names {
    puts "create_clock -name $n -period $period"
  }
}
emit_clocks {clk_a clk_b clk_c} 2.0
`,
    },
  },
  {
    slug: "tcl-file-practical",
    track: "tcl",
    kind: "practical",
    title: "Read a report, print VIOLATED lines",
    minutes: 16,
    level: "working",
    difficulty: "medium",
    summary: "open / gets / close + string match — the core of a PrimeTime harvest script.",
    body: [
      "Open timing.rpt for reading. Loop gets until EOF. If the line matches *VIOLATED*, print it. Close the file.",
    ],
    checklist: [
      "open timing.rpt r.",
      "while {[gets ...]} or equivalent read loop.",
      "string match or regexp for VIOLATED.",
      "close the handle.",
    ],
    problem: {
      language: "tcl",
      starter: `# scan timing.rpt for VIOLATED

`,
      checks: [
        { id: "open", label: "open timing.rpt", kind: "regex", pattern: "open\\s+\"?timing\\.rpt\"?" },
        { id: "gets", label: "gets or read loop", kind: "regex", pattern: "\\bgets\\b|\\bread\\b" },
        { id: "hit", label: "matches VIOLATED", kind: "includes", pattern: "VIOLATED" },
        { id: "cl", label: "close the file", kind: "includes", pattern: "close" },
      ],
      solution: `set fh [open "timing.rpt" r]
while {[gets $fh line] >= 0} {
  if {[string match "*VIOLATED*" $line]} {
    puts $line
  }
}
close $fh
`,
    },
  },
  {
    slug: "tcl-quiz",
    track: "tcl",
    kind: "quiz",
    title: "Tcl quiz",
    minutes: 10,
    level: "foundations",
    passMark: 70,
    summary: "Quoting, lists, and substitution.",
    body: ["Six questions. 70% to pass."],
    questions: [
      {
        id: "tcl1",
        prompt: "{ $x } (braces) means:",
        choices: [
          "Substitute $x then make a list",
          "Literal characters — no $ or [ ] substitution",
          "Run a command named $x",
          "Same as expr",
        ],
        answer: 1,
        explain: "Braces quote literally. Double quotes and [ ] do substitution.",
      },
      {
        id: "tcl2",
        prompt: "[get_ports clk] in Tcl:",
        choices: [
          "Is a comment",
          "Runs get_ports clk and splices the result",
          "Always errors",
          "Creates a Verilog port",
        ],
        answer: 1,
        explain: "Square brackets are command substitution.",
      },
      {
        id: "tcl3",
        prompt: "A Tcl list is primarily:",
        choices: ["A binary array", "A string with list quoting conventions", "A hash", "A file handle"],
        answer: 1,
        explain: "lindex / foreach operate on that string convention.",
      },
      {
        id: "tcl4",
        prompt: "Math on numbers should use:",
        choices: ["puts $a+$b", "expr {$a + $b}", "incr only", "eval always"],
        answer: 1,
        explain: "expr (preferably braced) is the arithmetic command.",
      },
      {
        id: "tcl5",
        prompt: "SDC create_clock is:",
        choices: ["A Verilog always block", "A Tcl command the STA tool implements", "A Perl hash", "A bash alias"],
        answer: 1,
        explain: "The tool extends Tcl with timing commands.",
      },
      {
        id: "tcl6",
        prompt: "foreach x $clocks { ... } iterates:",
        choices: ["Keys of an array only", "Each word/element of the list in $clocks", "Files in .", "PIDs"],
        answer: 1,
        explain: "foreach walks a Tcl list.",
      },
    ],
  },
  {
    slug: "tcl-test",
    track: "tcl",
    kind: "test",
    title: "Tcl lab test",
    minutes: 12,
    level: "working",
    passMark: 80,
    summary: "Closed-book. 80% to pass.",
    body: ["Quoting and file I/O under time pressure."],
    questions: [
      {
        id: "tt1",
        prompt: "Which does NOT substitute $clk?",
        choices: ['puts "$clk"', "puts { $clk }", "puts $clk", "puts [set clk]"],
        answer: 1,
        explain: "Braces are literal.",
      },
      {
        id: "tt2",
        prompt: "lappend clocks clk_scan does:",
        choices: ["Deletes clocks", "Appends clk_scan onto list clocks", "Opens a file", "Creates a generated clock"],
        answer: 1,
        explain: "lappend extends a list variable.",
      },
      {
        id: "tt3",
        prompt: "catch { open missing.r r } err is used to:",
        choices: ["Crash louder", "Trap an error into $err instead of aborting", "Compile Verilog", "Set SDC false paths"],
        answer: 1,
        explain: "catch returns 0/1 and can stash the message.",
      },
      {
        id: "tt4",
        prompt: "set x [lindex $names 0] takes:",
        choices: ["The last element", "The first element of list names", "A file size", "A regex group"],
        answer: 1,
        explain: "lindex 0 is the head.",
      },
    ],
  },

  // ——— Shell ———
  {
    slug: "shell-theory",
    track: "shell",
    kind: "theory",
    title: "Bash the farm actually runs",
    minutes: 18,
    level: "foundations",
    summary: "Pipes, grep/sed/awk, find, redirection, loops — how PD jobs are batched.",
    body: [
      "A VLSI machine is a Linux box. You live in bash (scripts) and often tcsh (interactive, legacy CAD). Learn bash well; the syntax transfers.",
      "Pipes connect stdout to stdin: grep VIOLATED timing.rpt | awk '{print $NF}'. Redirection: > overwrites, >> appends, 2> captures stderr (tool noise).",
      "grep -n pattern file. sed -n 's/old/new/gp'. awk '{print $1,$3}'. find . -name '*.rpt.gz' -print. xargs -P for farm-light parallelism. chmod 755 on your scripts.",
      "Variables: NAME=value (no spaces). \"$NAME\" when expanding. for f in *.v; do ...; done. if [[ -f $f ]]; then ...; fi. set -euo pipefail in scripts you ship.",
      "Jobs: nohup, tmux/screen, bsub/qsub/sbatch on LSF/SGE/Slurm. Never parse ls. Quote filenames that have spaces (blocks do).",
    ],
    code: {
      title: "harvest_wns.sh",
      lang: "bash",
      source: `#!/bin/bash
set -euo pipefail
for rpt in reports/*.rpt; do
  echo "== $rpt"
  grep -E "slack \\(VIOLATED\\)" "$rpt" | head
done`,
    },
  },
  {
    slug: "shell-video",
    track: "shell",
    kind: "video",
    title: "Unix commands for VLSI",
    minutes: 11,
    level: "foundations",
    summary: "NPTEL RTL-to-GDS tutorial: ls, cd, and the Unix you need before the tools.",
    youtubeId: "ztPFMRfpPfk",
    youtubeTitle: "Tutorial 1 — Unix commands (NPTEL VLSI Design Flow: RTL to GDS)",
    body: [
      "Short on-ramp. Then do the grep/find practicals.",
    ],
  },
  {
    slug: "shell-grep-practical",
    track: "shell",
    kind: "practical",
    title: "Harvest VIOLATED slacks",
    minutes: 12,
    level: "foundations",
    difficulty: "easy",
    summary: "grep the report, keep it a one-liner pipeline.",
    body: [
      "Write a bash snippet that greps VIOLATED in timing.rpt and pipes to head (so a huge dump does not flood you).",
    ],
    checklist: [
      "#!/bin/bash shebang.",
      "grep VIOLATED timing.rpt.",
      "Pipe to head.",
    ],
    problem: {
      language: "bash",
      starter: `#!/bin/bash
# print first VIOLATED hits from timing.rpt

`,
      checks: [
        { id: "sh", label: "bash shebang", kind: "includes", pattern: "#!/bin/bash" },
        { id: "g", label: "grep the report", kind: "includes", pattern: "grep" },
        { id: "v", label: "looks for VIOLATED", kind: "includes", pattern: "VIOLATED" },
        { id: "h", label: "pipes to head", kind: "regex", pattern: "\\|\\s*head" },
      ],
      solution: `#!/bin/bash
grep "VIOLATED" timing.rpt | head
`,
    },
  },
  {
    slug: "shell-find-practical",
    track: "shell",
    kind: "practical",
    title: "find Verilog, grep module",
    minutes: 14,
    level: "working",
    difficulty: "medium",
    summary: "Batch over *.v the way a lint wrapper does.",
    body: [
      "Loop or find files ending in .v. For each, grep -l module so you print only files that actually contain a module.",
    ],
    checklist: [
      "for-loop over *.v or find -name '*.v'.",
      "grep -l (or equivalent) for module.",
    ],
    problem: {
      language: "bash",
      starter: `#!/bin/bash
# list Verilog files that contain "module"

`,
      checks: [
        { id: "loop", label: "for-loop or find", kind: "regex", pattern: "\\bfor\\b|\\bfind\\b" },
        { id: "v", label: "targets .v files", kind: "regex", pattern: "\\*\\.v|['\"]\\.v['\"]" },
        { id: "g", label: "grep involved", kind: "includes", pattern: "grep" },
        { id: "m", label: "looks for module", kind: "includes", pattern: "module" },
      ],
      solution: `#!/bin/bash
for f in *.v; do
  grep -l "module" "$f"
done
`,
    },
  },
  {
    slug: "shell-quiz",
    track: "shell",
    kind: "quiz",
    title: "Shell quiz",
    minutes: 8,
    level: "foundations",
    passMark: 70,
    summary: "Pipes, grep, permissions.",
    body: ["Five questions."],
    questions: [
      {
        id: "sh1",
        prompt: "cmd1 | cmd2 sends:",
        choices: ["stderr of cmd1 to cmd2", "stdout of cmd1 to stdin of cmd2", "The file named |", "Nothing"],
        answer: 1,
        explain: "A pipe is stdout → stdin.",
      },
      {
        id: "sh2",
        prompt: "grep -n VIOLATED timing.rpt prints:",
        choices: ["Only file names", "Matching lines with line numbers", "A git diff", "Binary"],
        answer: 1,
        explain: "-n prefixes line numbers.",
      },
      {
        id: "sh3",
        prompt: "chmod 755 script.sh makes it:",
        choices: ["Unreadable", "rwxr-xr-x (owner execute, others read/exec)", "Setuid root", "A Tcl file"],
        answer: 1,
        explain: "Typical executable script mode.",
      },
      {
        id: "sh4",
        prompt: "2> tool.log captures:",
        choices: ["stdout", "stderr", "stdin", "The exit code only"],
        answer: 1,
        explain: "File descriptor 2 is stderr — where EDA tools dump noise.",
      },
      {
        id: "sh5",
        prompt: "for f in *.rpt; do grep WNS \"$f\"; done is safer than parsing ls because:",
        choices: [
          "ls cannot see .rpt",
          "The glob is expanded by the shell; quoting \"$f\" keeps spaces intact",
          "grep ignores ls",
          "It is slower so it is better",
        ],
        answer: 1,
        explain: "Do not parse ls. Glob + quote.",
      },
    ],
  },

  // ——— GVim ———
  {
    slug: "gvim-theory",
    track: "gvim",
    kind: "theory",
    title: "GVim commands for RTL and reports",
    minutes: 22,
    level: "foundations",
    summary: "Normal / insert / visual / command-line. The dozen commands you use all day.",
    body: [
      `## Modes — you are always in one

GVim is Vim with a GUI. The editor is **modal**. Click the lab above and type; the yellow block is the cursor.

COMPARE Modes
Mode | Enter | Leave | For
---
Normal | Esc | i / a / o / : / / | Motions and edits
Insert | i a o I A | Esc | Typing text
Visual | v (char) V (line) Ctrl-v (block) | Esc | Select then d/y
Command-line | : | Enter / Esc | \`:w\` \`:s\` \`:g\`
Search | / | Enter / Esc | Jump to a pattern
ENDCOMPARE

## Motions (stay in Normal)

TABLE
Keys | Move
---
h j k l | left / down / up / right
w b e | next word / back / end of word
0 ^ $ | start / first non-blank / end of line
gg G | top of file / bottom
12j | twelve lines down (counts work on most commands)
ENDTABLE

## Edits

- \`x\` delete char · \`dd\` delete line · \`yy\` yank line · \`p\` put
- \`u\` undo · \`Ctrl-r\` redo · \`.\` repeat last change
- \`i\` insert at cursor · \`a\` after cursor · \`o\` open line below

## Search and substitute (the VLSI 80%)

CODE vim
/VIOLATED
n
:%s/clk_core/clk_sys/g
:g/TODO/d
ENDCODE

- \`/pat\` then \`n\` / \`N\` — next / previous
- \`:%s/old/new/g\` — whole file, every match on the line
- \`:g/TODO/d\` — delete every line matching TODO
- \`:vimgrep /setup_time/ **/*.rpt\` then \`:copen\` — jump list across reports

TIP: Click the GVim lab, press \`/\`, type \`TODO\`, Enter, then run \`:%s/clk_core/clk_sys/g\`.

Q: Why does typing letters sometimes insert and sometimes move?
A: You are in Insert vs Normal. Esc is your friend. The status line in the lab shows the mode.

WARN: \`gg=G\` auto-indents C. Do **not** run it on a netlist or an SDC file.
`,
    ],
    code: {
      title: "gvim-cheatsheet.txt",
      lang: "text",
      source: `i a o          insert / append / open line
Esc            back to Normal
hjkl w b e     move
gg G           top / bottom
dd yy p        delete / yank / put line
/foo n N       search
:%s/old/new/g  substitute whole file
:g/TODO/d      delete lines matching
:vsp :sp       split
Ctrl-w w       next window
qa ... q  @a   record / play macro
:set nu ic     numbers, ignorecase`,
    },
  },
  {
    slug: "gvim-video",
    track: "gvim",
    kind: "video",
    title: "GVim basic commands",
    minutes: 19,
    level: "foundations",
    summary: "The Silicon Sandbox — motions and edits aimed at VLSI engineers.",
    youtubeId: "FLUQiBltf6g",
    youtubeTitle: "Part 2 | GVim Basic Commands | The Silicon Sandbox",
    body: [
      "Pause and type each command in gvim. Muscle memory is the point.",
    ],
  },
  {
    slug: "gvim-sub-practical",
    track: "gvim",
    kind: "practical",
    title: "Global substitute a clock name",
    minutes: 8,
    level: "foundations",
    difficulty: "easy",
    summary: "Rename clk_core → clk_sys across the file, no confirm.",
    body: [
      "Write the ex command that substitutes every clk_core with clk_sys in the whole buffer.",
    ],
    checklist: [
      ":%s/…/…/g  (range is %, flag g).",
      "old = clk_core, new = clk_sys.",
    ],
    problem: {
      language: "vim",
      starter: `" one ex command — rename clk_core to clk_sys everywhere

`,
      checks: [
        { id: "s", label: ":%s substitute whole file", kind: "includes", pattern: ":%s/" },
        { id: "old", label: "finds clk_core", kind: "includes", pattern: "clk_core" },
        { id: "new", label: "replaces with clk_sys", kind: "includes", pattern: "clk_sys" },
        { id: "g", label: "global flag /g", kind: "regex", pattern: "/g\\b" },
      ],
      solution: `:%s/clk_core/clk_sys/g
`,
    },
  },
  {
    slug: "gvim-global-practical",
    track: "gvim",
    kind: "practical",
    title: "Delete TODOs and split a report",
    minutes: 10,
    level: "working",
    difficulty: "medium",
    summary: ":g delete + :sp — clean a file, then look at timing.rpt beside it.",
    body: [
      "Delete every line that contains TODO. Then :sp timing.rpt so you can diff mentally.",
    ],
    checklist: [
      ":g/TODO/d (or :g/TODO/delete).",
      ":sp timing.rpt (or :split).",
    ],
    problem: {
      language: "vim",
      starter: `" delete TODO lines, then split-open timing.rpt

`,
      checks: [
        { id: "g", label: ":g global command", kind: "regex", pattern: ":g/" },
        { id: "todo", label: "targets TODO", kind: "includes", pattern: "TODO" },
        { id: "d", label: "deletes those lines", kind: "regex", pattern: "/d|:delete" },
        { id: "sp", label: "splits timing.rpt", kind: "regex", pattern: ":(sp|split|vsp|vsplit)\\s+timing\\.rpt" },
      ],
      solution: `:g/TODO/d
:sp timing.rpt
`,
    },
  },
  {
    slug: "gvim-quiz",
    track: "gvim",
    kind: "quiz",
    title: "GVim quiz",
    minutes: 8,
    level: "foundations",
    passMark: 70,
    summary: "Motions, substitute, splits.",
    body: ["Six questions."],
    questions: [
      {
        id: "gv1",
        prompt: "dd in Normal mode:",
        choices: ["Saves the file", "Deletes the current line", "Opens a split", "Starts insert"],
        answer: 1,
        explain: "d is delete, doubled = whole line.",
      },
      {
        id: "gv2",
        prompt: ":%s/foo/bar/gc means:",
        choices: [
          "Replace first foo only",
          "Whole file, all on each line, confirm each",
          "Compile Verilog",
          "Quit",
        ],
        answer: 1,
        explain: "% = whole file, g = all per line, c = confirm.",
      },
      {
        id: "gv3",
        prompt: "gg vs G:",
        choices: ["Undo vs redo", "Top of file vs last line", "Next vs prev search", "Split vs tab"],
        answer: 1,
        explain: "gg first line, G last.",
      },
      {
        id: "gv4",
        prompt: ":vsp file.v:",
        choices: ["Vertical split opening file.v", "Macro replay", "Make", "Paste"],
        answer: 0,
        explain: "vsplit. :sp is horizontal.",
      },
      {
        id: "gv5",
        prompt: "u and Ctrl-r:",
        choices: ["Search", "Undo and redo", "Save and quit", "Next buffer"],
        answer: 1,
        explain: "Undo / redo stack.",
      },
      {
        id: "gv6",
        prompt: "qa then q then @a:",
        choices: ["Quit all", "Record macro a, stop, replay it", "Tab a", "Sort"],
        answer: 1,
        explain: "q{reg} records, @{reg} plays.",
      },
    ],
  },
  {
    slug: "gvim-test",
    track: "gvim",
    kind: "test",
    title: "GVim lab test",
    minutes: 8,
    level: "working",
    passMark: 80,
    summary: "What you type when the report is 80k lines.",
    body: ["Closed-book."],
    questions: [
      {
        id: "gt1",
        prompt: "Jump to line 4821:",
        choices: [":4821 or 4821G", "/4821", "dd 4821", "Ctrl-f 4821"],
        answer: 0,
        explain: "A count plus G, or :lineno.",
      },
      {
        id: "gt2",
        prompt: "Delete every empty line:",
        choices: [":%d", ":g/^$/d", ":s/ //g", "gg dG"],
        answer: 1,
        explain: ":g on blank-line pattern.",
      },
      {
        id: "gt3",
        prompt: "n after /slack:",
        choices: ["New file", "Next match", "Line number", "Paste"],
        answer: 1,
        explain: "n / N walk search matches.",
      },
      {
        id: "gt4",
        prompt: ":noh is:",
        choices: ["No history", "Clear search highlight", "Normal mode help", "New host"],
        answer: 1,
        explain: ":nohlsearch.",
      },
    ],
  },

  // ——— Perl ———
  {
    slug: "perl-theory",
    track: "perl",
    kind: "theory",
    title: "Perl for report and netlist scraping",
    minutes: 22,
    level: "working",
    summary: "Scalars, arrays, hashes, while (<>), and the regex that built EDA glue.",
    body: [
      `## Perl is three sigils

COMPARE Types
Sigil | Name | Example | Access one
---
\`$\` | scalar | \`my $wns = -0.42;\` | the value
\`@\` | array | \`my @clk = ("core", "scan");\` | \`$clk[0]\`
\`%\` | hash | \`my %per = (core => 2.0);\` | \`$per{core}\`
ENDCOMPARE

- \`my\` = lexical (always, with \`use strict\`)
- \`print "WNS=$wns\\n";\`
- \`foreach my $c (@clk) { ... }\`

TRY perl
my $wns = "-0.42";
my @paths = ("alu/q", "mac/acc");
print "WNS=$wns\\n";
foreach my $p (@paths) {
  print "ep $p\\n";
}
ENDTRY

## Regex is first-class

CODE perl
while (<>) {
  if (/slack\\s+\\(VIOLATED\\)\\s+(-?[\\d.]+)/) {
    print "$1\\n";
  }
}
ENDCODE

TABLE
Form | Meaning
---
\`/pat/\` | match
\`s/old/new/g\` | substitute
\`split /\\s+/\` | fields
\`\$1\` | first capture
ENDTABLE

Q: Why \`use strict; use warnings;\` at the top of every harvester?
A: Typos like \`$wnss\` become compile errors instead of silent undef on a 2 GB log.

WARN: New farms should be Python. You still have to **read** the Perl that ships with every IP kit.
`,
    ],
    code: {
      title: "wns.pl",
      lang: "perl",
      source: `#!/usr/bin/perl
use strict;
use warnings;
my $wns = 0;
while (<>) {
  if (/slack\\s+\\(VIOLATED\\)\\s+(-?\\d+\\.\\d+)/) {
    $wns = $1 if $1 < $wns;
  }
}
print "WNS $wns\\n";`,
    },
  },
  {
    slug: "perl-video",
    track: "perl",
    kind: "video",
    title: "PERL for IC-design scripting",
    minutes: 53,
    level: "foundations",
    summary: "NPTEL Linux Programming & Scripting — Perl module.",
    youtubeId: "ToXoYX1RYiE",
    youtubeTitle: "Mod-03 Lec-12 PERL — NPTEL Linux Programming & Scripting",
    body: [
      "Scalars and the first regex. Then harvest slacks in the practical.",
    ],
  },
  {
    slug: "perl-slack-practical",
    track: "perl",
    kind: "practical",
    title: "Pull VIOLATED slack numbers",
    minutes: 14,
    level: "working",
    difficulty: "medium",
    summary: "while (<>) + a capture group — classic PrimeTime scrape.",
    body: [
      "Read stdin/ARGV. On lines with slack (VIOLATED) and a number, print that number.",
    ],
    checklist: [
      "while (<>) line loop.",
      "Regex with a capture for the slack value.",
      "print the capture.",
    ],
    problem: {
      language: "perl",
      starter: `#!/usr/bin/perl
use strict;
use warnings;
# print each VIOLATED slack from <>

`,
      checks: [
        { id: "w", label: "while (<>) (or while <>)", kind: "regex", pattern: "while\\s*\\(\\s*<>\\s*\\)|while\\s*<>" },
        { id: "re", label: "regex match (m// or / /)", kind: "regex", pattern: "m?/.+/" },
        { id: "v", label: "looks for VIOLATED", kind: "includes", pattern: "VIOLATED" },
        { id: "p", label: "prints the hit", kind: "includes", pattern: "print" },
      ],
      solution: `#!/usr/bin/perl
use strict;
use warnings;
while (<>) {
  if (/slack\\s+\\(VIOLATED\\)\\s+(-?\\d+\\.\\d+)/) {
    print "$1\\n";
  }
}
`,
    },
  },
  {
    slug: "perl-hash-practical",
    track: "perl",
    kind: "practical",
    title: "Clock-period hash",
    minutes: 12,
    level: "foundations",
    difficulty: "easy",
    summary: "Store clk_core → 2.0, clk_periph → 10.0 and print them.",
    body: [
      "my %period = (...). Loop keys and print \"name value\".",
    ],
    checklist: [
      "A hash %period (or similar) with both clocks.",
      "foreach keys.",
      "print both name and period.",
    ],
    problem: {
      language: "perl",
      starter: `#!/usr/bin/perl
use strict;
use warnings;
# clk_core => 2.0, clk_periph => 10.0

`,
      checks: [
        { id: "h", label: "declares a hash", kind: "regex", pattern: "my\\s+%\\w+" },
        { id: "c1", label: "clk_core entry", kind: "includes", pattern: "clk_core" },
        { id: "c2", label: "clk_periph entry", kind: "includes", pattern: "clk_periph" },
        { id: "k", label: "walks keys", kind: "includes", pattern: "keys" },
        { id: "p", label: "prints", kind: "includes", pattern: "print" },
      ],
      solution: `#!/usr/bin/perl
use strict;
use warnings;
my %period = (clk_core => 2.0, clk_periph => 10.0);
foreach my $c (keys %period) {
  print "$c $period{$c}\\n";
}
`,
    },
  },
  {
    slug: "perl-quiz",
    track: "perl",
    kind: "quiz",
    title: "Perl quiz",
    minutes: 8,
    level: "working",
    passMark: 70,
    summary: "Sigils, regex, diamonds.",
    body: ["Five questions."],
    questions: [
      {
        id: "p1",
        prompt: "$x vs @x vs %x:",
        choices: [
          "Same variable",
          "Scalar / array / hash",
          "Private / public / global",
          "Int / float / string",
        ],
        answer: 1,
        explain: "Sigils mark the slot you are looking at.",
      },
      {
        id: "p2",
        prompt: "while (<>) reads:",
        choices: ["Only STDIN if no ARGV files, else each ARGV file", "Sockets", "Tcl collections", "GDS"],
        answer: 0,
        explain: "The diamond operator is the report-scrape workhorse.",
      },
      {
        id: "p3",
        prompt: "If /foo (bar)/ matches, $1 is:",
        choices: ["The whole line", "The capture group (bar)", "The filename", "Always undef"],
        answer: 1,
        explain: "Numbered captures.",
      },
      {
        id: "p4",
        prompt: "chomp:",
        choices: ["Deletes the file", "Strips the trailing newline", "Compiles regex", "Sorts a hash"],
        answer: 1,
        explain: "Usually right after readline.",
      },
      {
        id: "p5",
        prompt: "keys %period returns:",
        choices: ["Values", "Clock names (hash keys)", "A file list", "PIDs"],
        answer: 1,
        explain: "values %period is the other half.",
      },
    ],
  },

  // ——— Python ———
  {
    slug: "python-theory",
    track: "python",
    kind: "theory",
    title: "Python as EDA glue",
    minutes: 16,
    level: "working",
    summary: "pathlib/glob, re, argparse — the modern replacement for a pile of Perl.",
    body: [
      "Python is what new CAD/methodology is written in: report harvest, job launchers, protobuf/JSON around OpenROAD, pandas on QOR tables.",
      "Read text with pathlib.Path('timing.rpt').read_text().splitlines() or a for line in open(...) loop. Always encoding='utf-8', errors='replace' on vendor logs.",
      "import re; m = re.search(r'slack\\s+\\(VIOLATED\\)\\s+(-?\\d+\\.\\d+)', line). glob.glob('reports/**/*.rpt', recursive=True). json / csv for anything you will plot.",
      "argparse for CLI. subprocess.run([...], check=True) to call PrimeTime wrappers — never shell=True with untrusted strings.",
      "Keep Tcl where the tool demands Tcl (SDC, vendor consoles). Use Python around the tool, not instead of SDC.",
    ],
    code: {
      title: "wns.py",
      lang: "python",
      source: `import re, sys
wns = 0.0
pat = re.compile(r"slack\\s+\\(VIOLATED\\)\\s+(-?\\d+\\.\\d+)")
for line in sys.stdin:
    m = pat.search(line)
    if m:
        wns = min(wns, float(m.group(1)))
print(f"WNS {wns}")`,
    },
  },
  {
    slug: "python-video",
    track: "python",
    kind: "video",
    title: "Python OS module for VLSI automation",
    minutes: 23,
    level: "working",
    summary: "TechSimplified TV — glob, paths, and file checks the way CAD scripts use them.",
    youtubeId: "djO8eao9_Bg",
    youtubeTitle: "Design Automation for VLSI Through Python — OS module examples",
    body: [
      "Pair with the glob practical. Regex harvest is the next session.",
    ],
  },
  {
    slug: "python-re-practical",
    track: "python",
    kind: "practical",
    title: "re.search VIOLATED slack",
    minutes: 14,
    level: "working",
    difficulty: "medium",
    summary: "Open timing.rpt, print captured slack numbers.",
    body: [
      "import re. Loop lines of timing.rpt. search a slack (VIOLATED) pattern with a group. print the group.",
    ],
    checklist: [
      "import re.",
      "open timing.rpt.",
      "re.search (or match/findall) with VIOLATED.",
      "print the capture.",
    ],
    problem: {
      language: "python",
      starter: `# print VIOLATED slack values from timing.rpt

`,
      checks: [
        { id: "im", label: "import re", kind: "includes", pattern: "import re" },
        { id: "op", label: "opens timing.rpt", kind: "includes", pattern: "timing.rpt" },
        { id: "se", label: "re.search / findall / match", kind: "regex", pattern: "re\\.(search|findall|match|compile)" },
        { id: "v", label: "looks for VIOLATED", kind: "includes", pattern: "VIOLATED" },
        { id: "pr", label: "prints hits", kind: "includes", pattern: "print" },
      ],
      solution: `import re
pat = re.compile(r"slack\\s+\\(VIOLATED\\)\\s+(-?\\d+\\.\\d+)")
for line in open("timing.rpt"):
    m = pat.search(line)
    if m:
        print(m.group(1))
`,
    },
  },
  {
    slug: "python-glob-practical",
    track: "python",
    kind: "practical",
    title: "glob all Verilog files",
    minutes: 8,
    level: "foundations",
    difficulty: "easy",
    summary: "List *.v the way a lint driver does.",
    body: [
      "import glob. glob.glob('*.v') (or pathlib). print each path.",
    ],
    checklist: [
      "import glob (or from pathlib import Path).",
      "Match *.v.",
      "print each file.",
    ],
    problem: {
      language: "python",
      starter: `# print every *.v in the cwd

`,
      checks: [
        { id: "im", label: "glob or pathlib", kind: "regex", pattern: "import glob|from glob|pathlib" },
        { id: "v", label: "pattern includes *.v", kind: "regex", pattern: "\\*\\.v|\\.v\"" },
        { id: "pr", label: "prints paths", kind: "includes", pattern: "print" },
      ],
      solution: `import glob
for path in glob.glob("*.v"):
    print(path)
`,
    },
  },
  {
    slug: "python-quiz",
    track: "python",
    kind: "quiz",
    title: "Python quiz",
    minutes: 8,
    level: "working",
    passMark: 70,
    summary: "re, glob, subprocess hygiene.",
    body: ["Five questions."],
    questions: [
      {
        id: "py1",
        prompt: "re.search(r'(\\d+)', line).group(1) is:",
        choices: ["The whole match only", "The first capture", "Always None", "A file handle"],
        answer: 1,
        explain: "group(0) whole, group(1) first paren.",
      },
      {
        id: "py2",
        prompt: "glob.glob('reports/**/*.rpt', recursive=True) needs:",
        choices: ["Nothing special", "recursive=True (or pathlib rglob)", "Tcl", "sudo"],
        answer: 1,
        explain: "** only expands when recursive is on in glob.",
      },
      {
        id: "py3",
        prompt: "subprocess.run(cmd, shell=True) with untrusted cmd is:",
        choices: ["Best practice", "Injection-prone — prefer a list argv, shell=False", "Required for Python", "Faster"],
        answer: 1,
        explain: "Pass argv lists.",
      },
      {
        id: "py4",
        prompt: "SDC / PrimeTime consoles still want:",
        choices: ["Only Python", "Tcl (Python wraps the tool, does not replace SDC)", "Only Perl", "YAML clocks"],
        answer: 1,
        explain: "Keep constraints in Tcl/SDC.",
      },
      {
        id: "py5",
        prompt: "Path('a.rpt').read_text().splitlines() is:",
        choices: ["Binary GDS", "All lines as a list of strings", "A subprocess", "A regex"],
        answer: 1,
        explain: "Simple file slurp for small reports.",
      },
    ],
  },

  // ——— XML ———
  {
    slug: "xml-theory",
    track: "xml",
    kind: "theory",
    title: "XML the EDA flow actually ships",
    minutes: 18,
    level: "foundations",
    summary: "Well-formed vs valid, attributes vs elements, namespaces, IP-XACT, and tool QOR XML.",
    body: [
      `## Well-formed vs valid

- **Well-formed:** one root, tags nest, attributes quoted, names case-sensitive. A parser will load it.
- **Valid:** also matches an XSD / DTD (IP-XACT schema).

COMPARE
Thing | Example | Role
---
Element | \`<slack>-0.12</slack>\` | Data you query
Attribute | \`<path type="setup">\` | Flags / ids
Namespace | \`xmlns:ipxact="..."\` | Stop vendor tags colliding
ENDCOMPARE

## XPath (run it in the lab)

TABLE
Query | Means
---
\`/timing_report/path\` | children of root
\`//slack\` | slack at any depth
\`path[@type='setup']\` | attribute filter
\`text()\` | element body
ENDTABLE

TRY xml
<timing_report>
  <path type="setup"><slack>-0.42</slack></path>
  <path type="hold"><slack>0.05</slack></path>
</timing_report>
ENDTRY

Use XPath \`//path[@type='setup']/slack\` in the lab.

WARN: SDC, UPF, and Liberty are **not** XML. Do not wrap clocks in tags.

Q: Regex or a parser?
A: Parse. Namespaces and pretty-print newlines will break a single regex.
`,
    ],
    code: {
      title: "timing.xml",
      lang: "xml",
      source: `<?xml version="1.0" encoding="UTF-8"?>
<timing_report tool="PrimeTime">
  <path group="reg2reg" type="setup">
    <startpoint>u_a/Q</startpoint>
    <endpoint>u_b/D</endpoint>
    <slack violated="true">-0.120</slack>
  </path>
</timing_report>`,
    },
  },
  {
    slug: "xml-video",
    track: "xml",
    kind: "video",
    title: "Extensible Markup Language (XML)",
    minutes: 60,
    level: "foundations",
    summary: "NPTEL Internet Technologies (IIT Kharagpur): prolog, DTD, well-formed vs valid.",
    youtubeId: "-oLlHA0Uy-s",
    youtubeTitle: "Lecture 16 — Extensible Markup Language (XML) — NPTEL Internet Technologies",
    body: [
      "Watch well-formed vs valid, then write the timing-report XML in the next practical.",
    ],
  },
  {
    slug: "xml-report-practical",
    track: "xml",
    kind: "practical",
    title: "Write a timing-report XML",
    minutes: 12,
    level: "foundations",
    difficulty: "easy",
    summary: "One well-formed document: path, startpoint, endpoint, slack.",
    body: [
      "Root element timing_report with attribute tool=\"PrimeTime\".",
      "One child path with attributes group=\"reg2reg\" and type=\"setup\".",
      "Inside the path: startpoint u_a/Q, endpoint u_b/D, slack -0.120 with violated=\"true\".",
      "XML declaration on line 1. Tags must nest and close.",
    ],
    checklist: [
      "<?xml version=\"1.0\" ...?>",
      "Root <timing_report tool=\"PrimeTime\">.",
      "<path group=\"reg2reg\" type=\"setup\">.",
      "<slack violated=\"true\">-0.120</slack>.",
    ],
    problem: {
      language: "xml",
      starter: `<?xml version="1.0" encoding="UTF-8"?>
<!-- one well-formed timing_report -->

`,
      checks: [
        { id: "decl", label: "XML declaration", kind: "includes", pattern: "<?xml" },
        { id: "root", label: "root timing_report", kind: "includes", pattern: "timing_report" },
        { id: "tool", label: "tool=\"PrimeTime\"", kind: "includes", pattern: "PrimeTime" },
        { id: "path", label: "path element with type setup", kind: "regex", pattern: "<path[\\s\\S]*type\\s*=\\s*\"setup\"" },
        { id: "sp", label: "startpoint u_a/Q", kind: "includes", pattern: "u_a/Q" },
        { id: "ep", label: "endpoint u_b/D", kind: "includes", pattern: "u_b/D" },
        {
          id: "sl",
          label: "slack -0.120 with violated=\"true\"",
          kind: "regex",
          pattern: "violated\\s*=\\s*\"true\"[\\s\\S]*-0\\.120|-0\\.120[\\s\\S]*violated\\s*=\\s*\"true\"",
        },
      ],
      solution: `<?xml version="1.0" encoding="UTF-8"?>
<timing_report tool="PrimeTime">
  <path group="reg2reg" type="setup">
    <startpoint>u_a/Q</startpoint>
    <endpoint>u_b/D</endpoint>
    <slack violated="true">-0.120</slack>
  </path>
</timing_report>
`,
    },
  },
  {
    slug: "xml-ipxact-practical",
    track: "xml",
    kind: "practical",
    title: "Minimal IP-XACT component",
    minutes: 16,
    level: "working",
    difficulty: "medium",
    summary: "vendor / library / name / version + one busInterface — the VLN tuple.",
    body: [
      "IEEE 1685 (IP-XACT) identifies IP by the VLNV tuple: vendor, library, name, version.",
      "Write a component uart, vendor ace-seek, library vlsi, version 1.0, with a busInterface named APB.",
      "Use the ipxact prefix and xmlns:ipxact on the root.",
    ],
    checklist: [
      "Root ipxact:component with xmlns:ipxact.",
      "vendor, library, name, version.",
      "busInterface named APB.",
    ],
    problem: {
      language: "xml",
      starter: `<?xml version="1.0" encoding="UTF-8"?>
<!-- IP-XACT component: ace-seek / vlsi / uart / 1.0 with APB -->

`,
      checks: [
        { id: "comp", label: "component root", kind: "includes", pattern: "component" },
        { id: "ns", label: "xmlns:ipxact namespace", kind: "includes", pattern: "xmlns:ipxact" },
        { id: "v", label: "vendor ace-seek", kind: "includes", pattern: "ace-seek" },
        { id: "lib", label: "library vlsi", kind: "includes", pattern: "vlsi" },
        { id: "n", label: "name uart", kind: "includes", pattern: "uart" },
        { id: "ver", label: "version element 1.0", kind: "regex", pattern: "<[^>]*version[^>]*>\\s*1\\.0\\s*<" },
        { id: "bus", label: "busInterface APB", kind: "regex", pattern: "busInterface[\\s\\S]*APB|APB[\\s\\S]*busInterface" },
      ],
      solution: `<?xml version="1.0" encoding="UTF-8"?>
<ipxact:component
  xmlns:ipxact="http://www.accellera.org/XMLSchema/IPXACT/1685-2022">
  <ipxact:vendor>ace-seek</ipxact:vendor>
  <ipxact:library>vlsi</ipxact:library>
  <ipxact:name>uart</ipxact:name>
  <ipxact:version>1.0</ipxact:version>
  <ipxact:busInterfaces>
    <ipxact:busInterface>
      <ipxact:name>APB</ipxact:name>
    </ipxact:busInterface>
  </ipxact:busInterfaces>
</ipxact:component>
`,
    },
  },
  {
    slug: "xml-etree-practical",
    track: "xml",
    kind: "practical",
    title: "Parse slack with ElementTree",
    minutes: 14,
    level: "working",
    difficulty: "medium",
    summary: "Python xml.etree — print each slack text and its violated attribute.",
    body: [
      "Parse timing.xml. Iterate every slack element. Print the text and the violated attribute.",
    ],
    checklist: [
      "import xml.etree.ElementTree as ET (or from xml.etree import ElementTree).",
      "ET.parse(\"timing.xml\").",
      "iter(\"slack\") or findall.",
      "print text and .get(\"violated\").",
    ],
    problem: {
      language: "python",
      starter: `# parse timing.xml — print each slack text and violated flag

`,
      checks: [
        { id: "im", label: "imports ElementTree", kind: "regex", pattern: "xml\\.etree|ElementTree" },
        { id: "p", label: "parses timing.xml", kind: "includes", pattern: "timing.xml" },
        { id: "it", label: "walks slack elements", kind: "includes", pattern: "slack" },
        { id: "g", label: "reads violated attribute", kind: "includes", pattern: "violated" },
        { id: "pr", label: "prints", kind: "includes", pattern: "print" },
      ],
      solution: `import xml.etree.ElementTree as ET
root = ET.parse("timing.xml").getroot()
for slack in root.iter("slack"):
    print(slack.text, slack.get("violated"))
`,
    },
  },
  {
    slug: "xml-quiz",
    track: "xml",
    kind: "quiz",
    title: "XML quiz",
    minutes: 8,
    level: "foundations",
    passMark: 70,
    summary: "Well-formed, namespaces, IP-XACT, XPath.",
    body: ["Six questions."],
    questions: [
      {
        id: "x1",
        prompt: "Well-formed XML means:",
        choices: [
          "It matches an XSD",
          "One root, tags nest and close, attributes quoted — a parser can load it",
          "It is pretty-printed",
          "It is SDC",
        ],
        answer: 1,
        explain: "Valid = well-formed plus schema. Well-formed is syntax only.",
      },
      {
        id: "x2",
        prompt: "IP-XACT (IEEE 1685) is used to:",
        choices: [
          "Place-and-route a floorplan",
          "Package IP metadata: VLNV, bus interfaces, memory maps",
          "Replace Verilog",
          "Write clocks in XML instead of SDC",
        ],
        answer: 1,
        explain: "IP-XACT is the IP packaging XML standard. Constraints stay Tcl/SDC.",
      },
      {
        id: "x3",
        prompt: "xmlns:ipxact=\"http://...\" on the root:",
        choices: [
          "Is a comment",
          "Binds the ipxact prefix to that namespace URI",
          "Downloads the schema at runtime always",
          "Turns XML into JSON",
        ],
        answer: 1,
        explain: "The URI is the identity of the namespace, not necessarily fetched.",
      },
      {
        id: "x4",
        prompt: "XPath //slack means:",
        choices: [
          "Only the document element named slack",
          "Any slack element at any depth",
          "A bash comment",
          "A Tcl list",
        ],
        answer: 1,
        explain: "// is descendant-or-self. /slack would be a child of the root only.",
      },
      {
        id: "x5",
        prompt: "<slack violated=\"true\">-0.12</slack> — the number is:",
        choices: ["An attribute", "Element text content", "A namespace", "A DTD"],
        answer: 1,
        explain: "violated is the attribute; -0.12 is the element's text.",
      },
      {
        id: "x6",
        prompt: "Scraping namespaced XML with a single regex is brittle because:",
        choices: [
          "Regex is illegal",
          "Prefixes, whitespace, and default xmlns move; a parser does not care",
          "XML cannot contain numbers",
          "PrimeTime forbids XML",
        ],
        answer: 1,
        explain: "Use a real parser (ElementTree, LibXML, tdom).",
      },
    ],
  },
  {
    slug: "xml-test",
    track: "xml",
    kind: "test",
    title: "XML lab test",
    minutes: 8,
    level: "working",
    passMark: 80,
    summary: "Closed-book. 80% to pass.",
    body: ["Well-formed rules and IP-XACT VLNV."],
    questions: [
      {
        id: "xt1",
        prompt: "Which is NOT well-formed?",
        choices: [
          "<a><b/></a>",
          "<A></a>",
          "<a b=\"1\"></a>",
          "<?xml version=\"1.0\"?><a/>",
        ],
        answer: 1,
        explain: "Tag names are case-sensitive. <A> does not close with </a>.",
      },
      {
        id: "xt2",
        prompt: "VLNV in IP-XACT is:",
        choices: [
          "Voltage, length, net, via",
          "vendor, library, name, version",
          "Verilog, Liberty, NDM, VA",
          "A clock group",
        ],
        answer: 1,
        explain: "The unique identity of a component.",
      },
      {
        id: "xt3",
        prompt: "XPath /timing_report/path[@type='setup']/slack selects:",
        choices: [
          "Every slack in the file",
          "slack children of path elements that have type setup under the root timing_report",
          "A Tcl clock",
          "Invalid XPath",
        ],
        answer: 1,
        explain: "Rooted path plus an attribute predicate.",
      },
      {
        id: "xt4",
        prompt: "SDC should be stored as:",
        choices: ["IP-XACT only", "Tcl/SDC (not XML)", "JSON clocks only", "A .gds"],
        answer: 1,
        explain: "XML wraps metadata and some QOR dumps. Constraints stay SDC.",
      },
    ],
  },

  // ——— Verilog ———
  {
    slug: "verilog-theory",
    track: "verilog",
    kind: "theory",
    layer: "beginner",
    title: "Verilog Hardware Description Fundamentals & Abstraction Levels",
    minutes: 24,
    level: "foundations",
    summary: "Hardware abstraction levels, 4-state logic, vectors vs scalars, and synthesizable RTL semantics.",
    body: [
      `## Verilog is hardware, not a program

Every \`assign\` and \`always\` is **alive at the same time**. There is no "first line then second line" in silicon.

FLOW: Structural gates → Dataflow assign → Behavioral always → Synthesis → Standard cells

## 4-state values

TABLE
Value | Silicon meaning | How you get it
---
0 | Driven to GND | Reset, pull-down
1 | Driven to VDD | Set, pull-up
X | Unknown / fight | Uninitialized flop, two drivers
Z | Undriven | Tri-state off, unused bus
ENDTABLE

The lab above lets you poke 0/1/X/Z and slice a vector.

## Blocking vs non-blocking (the race)

COMPARE Assignments
Where | Operator | Region | If you get it wrong
---
\`always @(*)\` combo | \`=\` blocking | Active | Use \`<=\` and combo looks sequential
\`always @(posedge clk)\` | \`<=\` NBA | NBA (all flops together) | Use \`=\` and two flops race — sim depends on file order
ENDCOMPARE

CODE verilog
always @(posedge clk) begin
  q1 <= d;     // both sample OLD values
  q2 <= q1;    // shift register, not a combo chain
end
ENDCODE

Q: Why does \`q2 <= q1\` not see the new q1 in the same edge?
A: NBA updates all left-hand sides together after the edge. That matches real flops.

## Vectors

- \`wire [7:0] bus;\` — 8 bits, bus[7] is the MSB if declared [7:0]
- Slice: \`bus[3:0]\` or \`bus[i +: 4]\`
- Concat: \`{a, b}\` · replicate: \`{4{1'b0}}\`

WARN: An incomplete \`if\` in \`always @(*)\` infers a **latch**. Assign a default on the first line.
`,
    ],
    code: {
      title: "dff_enable.v",
      lang: "verilog",
      source: `module dff_enable (
  input  wire clk,
  input  wire rst_n,
  input  wire en,
  input  wire d,
  output reg  q
);
  // Sequential register with active-low async reset and clock enable
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      q <= 1'b0;
    end else if (en) begin
      q <= d;
    end
  end
endmodule`,
    },
  },
  {
    slug: "verilog-video",
    track: "verilog",
    kind: "video",
    layer: "beginner",
    title: "Getting Started with Verilog HDL",
    minutes: 38,
    level: "foundations",
    summary: "NPTEL Hardware Modeling Lecture: Language features, synthesis constructs, and RTL modeling.",
    youtubeId: "9uw25PU5B3k",
    youtubeTitle: "Getting Started with Verilog — NPTEL Hardware Modeling Using Verilog",
    body: [
      "Watch the lecture to understand how Verilog HDL translates into silicon standard cells.",
      "Follow along with the practical exercises below to implement multiplexers, registers, and counters.",
    ],
  },
  {
    slug: "verilog-mux-practical",
    track: "verilog",
    kind: "practical",
    layer: "beginner",
    title: "Beginner Practical: 4-to-1 Multiplexer with Default Assignment",
    minutes: 15,
    level: "foundations",
    difficulty: "easy",
    summary: "Design a glitch-free 4:1 multiplexer using synthesizable conditional expressions or case statements.",
    body: [
      "Multiplexers are the fundamental steering logic of digital datapaths. Complete module `mux4` routing one of four 8-bit data inputs to output `y` based on 2-bit select `sel`.",
      "Ensure all input conditions are completely specified to avoid unintentional latch inference.",
    ],
    checklist: [
      "Declare module `mux4` with 2-bit input `sel[1:0]`, four 8-bit inputs `d0, d1, d2, d3`, and 8-bit output `y`.",
      "Route `d0` when `sel == 2'b00`, `d1` when `sel == 2'b01`, `d2` when `sel == 2'b10`, and `d3` when `sel == 2'b11`.",
      "Use either a continuous `assign` with ternary operators or an `always @*` block with `case`."
    ],
    problem: {
      language: "verilog",
      starter: `module mux4 (
  input  wire [1:0] sel,
  input  wire [7:0] d0,
  input  wire [7:0] d1,
  input  wire [7:0] d2,
  input  wire [7:0] d3,
  output reg  [7:0] y
);

  // TODO: Implement 4:1 multiplexer logic

endmodule
`,
      checks: [
        { id: "mod", label: "module mux4 declaration", kind: "includes", pattern: "module mux4" },
        { id: "sel", label: "Inspects 2-bit sel", kind: "includes", pattern: "sel" },
        {
          id: "combo",
          label: "Combinational assign or always @*",
          kind: "regex",
          pattern: "assign\\s+y\\s*=|always\\s*@\\s*\\(\\s*\\*|case\\s*\\(\\s*sel",
        },
        { id: "end", label: "endmodule", kind: "includes", pattern: "endmodule" },
      ],
      solution: `module mux4 (
  input  wire [1:0] sel,
  input  wire [7:0] d0,
  input  wire [7:0] d1,
  input  wire [7:0] d2,
  input  wire [7:0] d3,
  output reg  [7:0] y
);

  always @(*) begin
    case (sel)
      2'b00:   y = d0;
      2'b01:   y = d1;
      2'b10:   y = d2;
      2'b11:   y = d3;
      default: y = 8'h00;
    endcase
  end

endmodule
`,
    },
  },
  {
    slug: "verilog-dff-practical",
    track: "verilog",
    kind: "practical",
    layer: "beginner",
    title: "Beginner Practical: D Flip-Flop with Active-Low Async Reset & Enable",
    minutes: 15,
    level: "foundations",
    difficulty: "easy",
    summary: "Implement an edge-triggered register with asynchronous reset and clock gating enable.",
    body: [
      "In ASIC standard cell libraries, flip-flops with asynchronous reset (`rst_n`) clear immediately upon reset assertion, independent of the clock.",
      "Clock enable (`en`) prevents the flop from toggling when new data is not ready, saving dynamic power.",
    ],
    checklist: [
      "Sensitivity list must include `posedge clk or negedge rst_n`.",
      "When `!rst_n`, immediately clear `q <= 0`.",
      "When `rst_n == 1`, update `q <= d` only when `en == 1`.",
      "Use non-blocking assignment (`<=`) for all sequential updates."
    ],
    problem: {
      language: "verilog",
      starter: `module dff_en_async (
  input  wire clk,
  input  wire rst_n,
  input  wire en,
  input  wire d,
  output reg  q
);

  // TODO: Implement D-FF with active-low async reset and clock enable

endmodule
`,
      checks: [
        { id: "alw", label: "always block present", kind: "includes", pattern: "always" },
        {
          id: "sens",
          label: "posedge clk and negedge rst_n",
          kind: "regex",
          pattern: "posedge\\s+clk[\\s\\S]*negedge\\s+rst_n|negedge\\s+rst_n[\\s\\S]*posedge\\s+clk",
        },
        { id: "nba", label: "Non-blocking assign q <=", kind: "regex", pattern: "q\\s*<=" },
        { id: "en", label: "Clock enable gating", kind: "includes", pattern: "en" },
      ],
      solution: `module dff_en_async (
  input  wire clk,
  input  wire rst_n,
  input  wire en,
  input  wire d,
  output reg  q
);

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n)
      q <= 1'b0;
    else if (en)
      q <= d;
  end

endmodule
`,
    },
  },
  {
    slug: "verilog-counter-practical",
    track: "verilog",
    kind: "practical",
    layer: "beginner",
    title: "Beginner Practical: 8-Bit Up/Down Loadable Synchronous Counter",
    minutes: 18,
    level: "working",
    difficulty: "medium",
    summary: "Design an 8-bit multi-function synchronous counter with parallel load, enable, and direction control.",
    body: [
      "Digital timers, DMA address generators, and memory pointers rely on versatile up/down counters.",
      "Complete module `counter8_load` with priority ordering: 1) Active-low async reset `rst_n`, 2) Parallel load `load`, 3) Count enable `en` with direction `up_down` (1 for count up, 0 for count down).",
    ],
    checklist: [
      "Sensitivity list: `always @(posedge clk or negedge rst_n)`.",
      "When `!rst_n`, reset count `q <= 8'd0`.",
      "If `load == 1`, load parallel data `q <= data_in`.",
      "If `load == 0` and `en == 1`, increment (`q + 1`) if `up_down == 1`, otherwise decrement (`q - 1`)."
    ],
    problem: {
      language: "verilog",
      starter: `module counter8_load (
  input  wire       clk,
  input  wire       rst_n,
  input  wire       load,
  input  wire       en,
  input  wire       up_down,
  input  wire [7:0] data_in,
  output reg  [7:0] q
);

  // TODO: Implement 8-bit loadable up/down counter

endmodule
`,
      checks: [
        {
          id: "sens",
          label: "posedge clk with async rst_n",
          kind: "regex",
          pattern: "posedge\\s+clk",
        },
        { id: "load", label: "Parallel load check", kind: "includes", pattern: "load" },
        { id: "en", label: "Count enable gating", kind: "includes", pattern: "en" },
        {
          id: "inc",
          label: "Increments and decrements q",
          kind: "regex",
          pattern: "q\\s*<=\\s*q\\s*\\+|q\\s*<=\\s*q\\s*\\-",
        },
      ],
      solution: `module counter8_load (
  input  wire       clk,
  input  wire       rst_n,
  input  wire       load,
  input  wire       en,
  input  wire       up_down,
  input  wire [7:0] data_in,
  output reg  [7:0] q
);

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      q <= 8'h00;
    end else if (load) begin
      q <= data_in;
    end else if (en) begin
      if (up_down)
        q <= q + 8'd1;
      else
        q <= q - 8'd1;
    end
  end

endmodule
`,
    },
  },
  {
    slug: "verilog-quiz",
    track: "verilog",
    kind: "quiz",
    layer: "beginner",
    title: "Verilog fundamentals quiz",
    minutes: 10,
    level: "foundations",
    passMark: 70,
    summary: "Blocking vs nonblocking, combo vs sequential, resets.",
    body: ["Six questions. 70% to pass."],
    questions: [
      {
        id: "v1",
        prompt: "In a posedge-clk flop, q should be updated with:",
        choices: ["blocking =", "nonblocking <=", "assign only", "force"],
        answer: 1,
        explain: "Nonblocking schedules NBA updates after the clock edge and avoids races between flops.",
      },
      {
        id: "v2",
        prompt: "always @(*) is for:",
        choices: ["Flip-flops", "Latches only", "Combinational (sensitivity to all reads)", "Testbench delay"],
        answer: 2,
        explain: "@* re-evaluates when any signal read on the RHS changes.",
      },
      {
        id: "v3",
        prompt: "Async active-low reset belongs:",
        choices: [
          "Only as if (rst_n) inside posedge clk",
          "In the sensitivity list: or negedge rst_n",
          "In an assign statement",
          "Never in RTL",
        ],
        answer: 1,
        explain: "Otherwise reset is synchronous — it waits for the next clock.",
      },
      {
        id: "v4",
        prompt: "An incomplete if in always @(*) typically infers:",
        choices: ["A flop", "A latch", "A clock gate", "Nothing"],
        answer: 1,
        explain: "The output holds its old value when the if is false → latch.",
      },
      {
        id: "v5",
        prompt: "A 2FF synchronizer is for:",
        choices: [
          "Multi-bit buses with no protocol",
          "A single-bit (or gray) signal into another clock",
          "Hold fixing",
          "Scan",
        ],
        answer: 1,
        explain: "Independent bits of a bus can skew; use FIFO/handshake/gray for multi-bit.",
      },
      {
        id: "v6",
        prompt: "assign y = a & b; drives y as a:",
        choices: ["reg updated at posedge", "continuous net assignment", "testbench task", "UDP"],
        answer: 1,
        explain: "Continuous assign is combinational net-driven hardware.",
      },
    ],
  },
  {
    slug: "verilog-test",
    track: "verilog",
    kind: "test",
    layer: "beginner",
    title: "Verilog lab test",
    minutes: 15,
    level: "working",
    passMark: 80,
    summary: "Closed-book style. 80% to pass.",
    body: ["Treat this like a screening quiz before you open RTL Lab in Studio."],
    questions: [
      {
        id: "vt1",
        prompt: "Which sensitivity is a typical async-reset flop?",
        choices: [
          "always @(posedge clk)",
          "always @(posedge clk or negedge rst_n)",
          "always @(*)",
          "always @(rst_n)",
        ],
        answer: 1,
        explain: "Clock and async reset edges both must trigger the block.",
      },
      {
        id: "vt2",
        prompt: "q <= q + 1 inside posedge clk is:",
        choices: ["A combinational incrementer", "A sequential counter", "Illegal", "A latch"],
        answer: 1,
        explain: "Registered increment = counter.",
      },
      {
        id: "vt3",
        prompt: "The synthesizable mux assign y = sel ? b : a is:",
        choices: ["Sequential", "Combinational", "A memory", "A clock"],
        answer: 1,
        explain: "Ternary assign is combo logic.",
      },
      {
        id: "vt4",
        prompt: "Blocking = inside a sequential flop block is risky because:",
        choices: [
          "It uses more area always",
          "It can race with other flops in the same timestep",
          "Synthesis forbids = everywhere",
          "It disables reset",
        ],
        answer: 1,
        explain: "NBA (<=) is the sequential coding convention to avoid sim/synth mismatch.",
      },
      {
        id: "vt5",
        prompt: "Two flops back-to-back with no combo between them in the dest clock are a:",
        choices: ["Adder", "2FF synchronizer", "PLL", "Scan compressor"],
        answer: 1,
        explain: "Standard single-bit CDC synchronizer.",
      },
    ],
  },

  // ——— SDC ———
  {
    slug: "sdc-clocks-theory",
    track: "sdc",
    kind: "theory",
    title: "Clock definition & generated clocks",
    minutes: 18,
    level: "foundations",
    summary:
      "create_clock vs create_generated_clock, source latency, network latency, and why virtual clocks exist for I/O.",
    body: [
      "Every STA graph is rooted in clocks. A primary clock is an ideal waveform at a port or pin: period, waveform edges, and a name that every exception will later reference.",
      "Generated clocks model PLL / divider / mux outputs. They inherit (or override) the master clock and must name the source pin so STA can trace latency through the clock network.",
      "Virtual clocks do not exist on silicon. They are STA-only waveforms used to budget chip-to-chip I/O against an external device that is not in this netlist.",
      "Clock latency splits into source (off-chip / PLL) and network (on-chip CTS). Until CTS, set_clock_latency / set_clock_uncertainty stand in for real insertion delay and jitter/skew.",
    ],
    code: {
      title: "clocks.sdc",
      lang: "tcl",
      source: `create_clock -name clk_core -period 2.0 [get_ports clk]
set_clock_uncertainty 0.08 [get_clocks clk_core]
set_clock_latency -source 0.4 [get_clocks clk_core]
create_generated_clock -name clk_div2 -source [get_ports clk] \\
  -divide_by 2 [get_pins u_ckdiv/Q]
create_clock -name vclk_ext -period 2.0`,
    },
  },
  {
    slug: "sdc-video",
    track: "sdc",
    kind: "video",
    title: "SDC constraints (NPTEL)",
    minutes: 39,
    level: "foundations",
    summary: "I/O delay, false paths, multicycle, and how SDC talks to STA.",
    youtubeId: "psrHHK7GFiY",
    youtubeTitle: "Constraints II — NPTEL VLSI Design Flow: RTL to GDS",
    body: [
      "This lecture maps set_input_delay / set_output_delay and timing exceptions onto the SDC you will write in the practicals.",
    ],
  },
  {
    slug: "sdc-io-practical",
    track: "sdc",
    kind: "practical",
    title: "I/O budgeting SDC",
    minutes: 22,
    level: "working",
    difficulty: "medium",
    summary: "500 MHz clock, matching virtual clock, max/min input and output delays.",
    body: [
      "clk is 500 MHz at port clk (period 2.0 ns).",
      "Create a virtual clock vclk_ext with the same period (no port).",
      "Inputs: set_input_delay -max 0.6 and -min 0.1 vs vclk_ext on get_ports data_in.",
      "Outputs: set_output_delay -max 0.8 and -min 0.2 vs vclk_ext on get_ports data_out.",
    ],
    checklist: [
      "create_clock named clk, period 2.0, on [get_ports clk].",
      "Virtual clock vclk_ext, period 2.0.",
      "Input and output delays both have -max and -min.",
    ],
    problem: {
      language: "tcl",
      starter: `# 500 MHz on-chip clock + virtual I/O clock + delays
# data_in / data_out are the data ports

`,
      checks: [
        { id: "clk", label: "create_clock for the on-chip clock", kind: "includes", pattern: "create_clock" },
        { id: "per", label: "period 2.0 (500 MHz)", kind: "regex", pattern: "-period\\s+2(\\.0)?" },
        { id: "vclk", label: "virtual clock named vclk_ext", kind: "includes", pattern: "vclk_ext" },
        { id: "in", label: "set_input_delay", kind: "includes", pattern: "set_input_delay" },
        { id: "out", label: "set_output_delay", kind: "includes", pattern: "set_output_delay" },
        { id: "max", label: "uses -max", kind: "includes", pattern: "-max" },
        { id: "min", label: "uses -min", kind: "includes", pattern: "-min" },
      ],
      solution: `create_clock -name clk -period 2.0 [get_ports clk]
create_clock -name vclk_ext -period 2.0
set_input_delay  -max 0.6 -clock vclk_ext [get_ports data_in]
set_input_delay  -min 0.1 -clock vclk_ext [get_ports data_in]
set_output_delay -max 0.8 -clock vclk_ext [get_ports data_out]
set_output_delay -min 0.2 -clock vclk_ext [get_ports data_out]
`,
    },
  },
  {
    slug: "sdc-exceptions-practical",
    track: "sdc",
    kind: "practical",
    title: "False paths, multicycle, clock groups",
    minutes: 24,
    level: "working",
    difficulty: "medium",
    summary: "Two clocks, async groups, one documented multicycle — no star false path.",
    body: [
      "clk_core period 2.0 on port clk. clk_periph period 10.0 on port clk_p.",
      "Declare them asynchronous with set_clock_groups.",
      "2-cycle setup multicycle from u_slow/Q to u_cpu/D, with hold of 1.",
      "Do not write set_false_path -from * -to *.",
    ],
    checklist: [
      "Two create_clock commands.",
      "set_clock_groups -asynchronous with both names.",
      "set_multicycle_path -setup 2 and -hold 1 on the named path.",
      "No global star false path.",
    ],
    problem: {
      language: "tcl",
      starter: `# clk_core @ 2 ns, clk_periph @ 10 ns
# async groups + 2-cycle multicycle on u_slow/Q -> u_cpu/D

`,
      checks: [
        { id: "c1", label: "defines clk_core", kind: "includes", pattern: "clk_core" },
        { id: "c2", label: "defines clk_periph", kind: "includes", pattern: "clk_periph" },
        {
          id: "grp",
          label: "set_clock_groups -asynchronous",
          kind: "regex",
          pattern: "set_clock_groups[\\s\\S]*-asynchronous",
        },
        { id: "mcp", label: "set_multicycle_path", kind: "includes", pattern: "set_multicycle_path" },
        { id: "setup", label: "setup multicycle of 2", kind: "regex", pattern: "-setup\\s+2" },
        { id: "hold", label: "hold multicycle of 1", kind: "regex", pattern: "-hold\\s+1" },
        {
          id: "star",
          label: "no global set_false_path -from * -to *",
          kind: "excludes",
          pattern: "set_false_path -from * -to *",
        },
      ],
      solution: `create_clock -name clk_core   -period 2.0  [get_ports clk]
create_clock -name clk_periph -period 10.0 [get_ports clk_p]
set_clock_groups -asynchronous -group {clk_core} -group {clk_periph}
set_multicycle_path -setup 2 -from [get_pins u_slow/Q] -to [get_pins u_cpu/D]
set_multicycle_path -hold  1 -from [get_pins u_slow/Q] -to [get_pins u_cpu/D]
`,
    },
  },
  {
    slug: "sdc-quiz",
    track: "sdc",
    kind: "quiz",
    title: "SDC fundamentals quiz",
    minutes: 12,
    level: "foundations",
    passMark: 70,
    summary: "Clocks, I/O delay, and exceptions.",
    body: ["Eight questions. 70% to pass. Explanations show after you submit."],
    questions: [
      {
        id: "q1",
        prompt: "A virtual clock is used primarily to:",
        choices: [
          "Drive an on-chip PLL",
          "Budget I/O against an external device not in the netlist",
          "Replace create_generated_clock",
          "Disable hold checks",
        ],
        answer: 1,
        explain:
          "Virtual clocks are STA-only waveforms for chip-to-chip timing. They have no source pin in this design.",
      },
      {
        id: "q2",
        prompt: "set_input_delay -max constrains which check?",
        choices: ["Hold", "Recovery", "Setup (external time already used)", "Removal"],
        answer: 2,
        explain: "Max input delay reduces available setup time at the first flop.",
      },
      {
        id: "q3",
        prompt: "create_generated_clock should specify:",
        choices: [
          "Only the period",
          "Master source pin and divide/multiply relationship",
          "Only set_clock_groups",
          "A virtual clock name",
        ],
        answer: 1,
        explain: "STA traces latency from the master source through the generate pin.",
      },
      {
        id: "q4",
        prompt: "A 2-cycle setup multicycle typically needs hold of:",
        choices: ["2", "0", "1 (N-1) unless tool defaults say otherwise", "Same as setup always"],
        answer: 2,
        explain: "Hold is usually N-1 for an N-cycle setup exception. Confirm with vendor docs.",
      },
      {
        id: "q5",
        prompt: "Best way to declare two unrelated async clocks:",
        choices: [
          "set_false_path -from * -to *",
          "set_clock_groups -asynchronous",
          "set_max_delay 0",
          "create_clock -add on the same pin",
        ],
        answer: 1,
        explain: "Clock groups keep domain intent explicit; a global false path hides real paths.",
      },
      {
        id: "q6",
        prompt: "Clock uncertainty models:",
        choices: [
          "Only metal RC",
          "Jitter, skew margin, and extra pessimism before/after CTS",
          "Only IR drop",
          "Only OCV derates",
        ],
        answer: 1,
        explain: "Uncertainty is the catch-all STA margin on clock edges.",
      },
      {
        id: "q7",
        prompt: "Forgetting -min on I/O delays most often causes:",
        choices: ["DRC errors", "Optimistic hold at I/O", "LVS fails", "Power-domain X"],
        answer: 1,
        explain: "Without min delay, hold at the boundary can look cleaner than silicon.",
      },
      {
        id: "q8",
        prompt: "set_false_path on a real data path is dangerous because:",
        choices: [
          "It increases area",
          "STA will not report real setup/hold fails on that path",
          "It breaks place-and-route",
          "It disables clocks",
        ],
        answer: 1,
        explain: "Exceptions must match silicon intent, not the slack report.",
      },
    ],
  },
  {
    slug: "sdc-lab-test",
    track: "sdc",
    kind: "test",
    title: "SDC lab test",
    minutes: 20,
    level: "working",
    passMark: 80,
    summary: "Pass mark 80%. Treat this like a signoff review.",
    body: ["Closed-book style. Finish the I/O practical first."],
    questions: [
      {
        id: "t1",
        prompt: "clk 500 MHz. Period is:",
        choices: ["2 ns", "1 ns", "0.5 ns", "5 ns"],
        answer: 0,
        explain: "T = 1/f = 1/0.5 GHz = 2 ns.",
      },
      {
        id: "t2",
        prompt: "Generated clock divide-by-2 from 2 ns master: period of generated clock is:",
        choices: ["1 ns", "2 ns", "4 ns", "0.5 ns"],
        answer: 2,
        explain: "Divide-by-2 doubles the period.",
      },
      {
        id: "t3",
        prompt: "Which pair is the usual I/O constraint set?",
        choices: [
          "set_driving_cell only",
          "set_input_delay + set_output_delay vs a (virtual) clock",
          "set_max_fanout only",
          "create_clock on every data port",
        ],
        answer: 1,
        explain: "I/O timing is delay relative to a clock edge, plus load/drive.",
      },
      {
        id: "t4",
        prompt: "Logically exclusive clocks are typically:",
        choices: [
          "Two clocks that never exist at the same time (muxed)",
          "Async always-on domains",
          "The same pin with -add",
          "Scan vs functional with false path *",
        ],
        answer: 0,
        explain: "-logically_exclusive is for muxed/selectable clocks.",
      },
      {
        id: "t5",
        prompt: "A path with set_max_delay 1.5 but no clock is:",
        choices: [
          "A combinational / interface budget",
          "Invalid SDC",
          "Always a false path",
          "A hold exception",
        ],
        answer: 0,
        explain: "Max delay can constrain combo clouds without a capturing flop.",
      },
    ],
  },

  // ——— STA ———
  {
    slug: "sta-setup-hold-theory",
    track: "sta",
    kind: "theory",
    title: "Setup, hold, and slack arithmetic",
    minutes: 20,
    level: "foundations",
    summary: "Data path vs clock path. Why hold is local and setup is global.",
    body: [
      "Setup: data launched by one edge must be stable before the capturing edge minus Tsu. Slack = required − arrival.",
      "Hold: data must not change too soon after the same (or next, per check type) capturing edge. Hold is a min-path problem.",
      "Setup failures are often fixed by logic restructuring, sizing, useful skew, or multicycle if the protocol allows. Hold failures are often buffer insertion on the data path or clock-path tuning.",
      "A timing report lists startpoint, endpoint, path group, and the split of cell/net delay. You will parse a snippet in the practical — not in Timing Studio.",
    ],
  },
  {
    slug: "sta-video",
    track: "sta",
    kind: "video",
    title: "Static Timing Analysis I",
    minutes: 53,
    level: "foundations",
    summary: "NPTEL: arrival vs required time, zero-clocking, double-clocking.",
    youtubeId: "qC5ZPVaOgTI",
    youtubeTitle: "Static Timing Analysis- I — NPTEL VLSI Design Flow: RTL to GDS",
    body: [
      "Watch through arrival/required time, then do the slack practical.",
    ],
  },
  {
    slug: "sta-report-practical",
    track: "sta",
    kind: "practical",
    title: "Read a path and compute slack",
    minutes: 20,
    level: "working",
    difficulty: "medium",
    summary: "From a tiny PrimeTime-style snippet: slack, check type, path group, one ECO.",
    body: [
      "Given report:",
      "Startpoint: u_a/Q (rising edge-triggered flop, clk)",
      "Endpoint:   u_b/D (rising edge-triggered flop, clk)",
      "Path Group: reg2reg",
      "Data required time  2.000",
      "Data arrival time   2.120",
      "Slack (VIOLATED)   -0.120",
    ],
    checklist: [
      "Write slack as -0.12 or -0.120 (setup fail).",
      "Name the check: setup.",
      "Name the path group: reg2reg.",
      "Propose one legal ECO word: size or buffer (not false_path).",
    ],
    problem: {
      language: "text",
      starter: `slack:
check:
group:
eco:
`,
      checks: [
        { id: "sl", label: "slack is −0.12", kind: "regex", pattern: "-0\\.12" },
        { id: "ck", label: "check type is setup", kind: "includes", pattern: "setup" },
        { id: "pg", label: "path group reg2reg", kind: "includes", pattern: "reg2reg" },
        {
          id: "eco",
          label: "ECO mentions size or buffer",
          kind: "regex",
          pattern: "size|buffer",
        },
      ],
      solution: `slack: -0.120
check: setup
group: reg2reg
eco: size the data-path cell (do not false-path a real path)
`,
    },
  },
  {
    slug: "sta-quiz",
    track: "sta",
    kind: "quiz",
    title: "STA quiz",
    minutes: 10,
    level: "foundations",
    passMark: 70,
    summary: "Slack, path groups, setup vs hold.",
    body: ["Pass mark 70%."],
    questions: [
      {
        id: "s1",
        prompt: "Negative setup slack means:",
        choices: [
          "Hold is failing",
          "Data arrives after the required time",
          "Clock is stopped",
          "The path is false",
        ],
        answer: 1,
        explain: "Slack = required − arrival. Negative setup → late data.",
      },
      {
        id: "s2",
        prompt: "Hold checks are most sensitive to:",
        choices: [
          "Long combo clouds",
          "Short data paths next to a slow clock network",
          "Only I/O delay -max",
          "Only WNS of setup",
        ],
        answer: 1,
        explain: "Min data delay vs clock skew/pessimism is the hold story.",
      },
      {
        id: "s3",
        prompt: "reg2reg path group is:",
        choices: ["Input port to flop", "Flop to flop", "Flop to output port", "Clock gate enable"],
        answer: 1,
        explain: "Internal sequential to sequential.",
      },
      {
        id: "s4",
        prompt: "Useful skew for setup typically:",
        choices: [
          "Delays the capture clock (or advances launch) to buy data time",
          "Always hurts hold",
          "Is illegal in STA",
          "Removes uncertainty",
        ],
        answer: 0,
        explain: "Intentional clock displacement can help setup; re-check hold.",
      },
      {
        id: "s5",
        prompt: "WNS is:",
        choices: [
          "Worst negative slack (worst failing path)",
          "Total negative slack",
          "Number of failing endpoints",
          "Clock period",
        ],
        answer: 0,
        explain: "TNS sums fails; WNS is the single worst.",
      },
    ],
  },
  {
    slug: "sta-eco-practical",
    track: "sta",
    kind: "practical",
    title: "ECO from a failing path",
    minutes: 25,
    level: "advanced",
    difficulty: "hard",
    summary: "Classify setup vs hold and write a legal fix — no bogus exception.",
    body: [
      "Path A: long combo, slack -0.20 setup, group reg2reg. Path B: slack -0.04 hold, start and end almost adjacent flops.",
      "Write two ECO lines. Do not close either path with set_false_path.",
    ],
    checklist: [
      "Mention setup on the long path and size/restructure.",
      "Mention hold on the short path and buffer/delay.",
      "Do not use set_false_path.",
    ],
    problem: {
      language: "text",
      starter: `path_a:
path_b:
`,
      checks: [
        { id: "su", label: "path A treated as setup", kind: "includes", pattern: "setup" },
        { id: "ho", label: "path B treated as hold", kind: "includes", pattern: "hold" },
        {
          id: "fixa",
          label: "setup fix: size / retime / split",
          kind: "regex",
          pattern: "size|retime|split|restruct",
        },
        {
          id: "fixb",
          label: "hold fix: buffer or delay",
          kind: "regex",
          pattern: "buffer|delay",
        },
        {
          id: "fp",
          label: "does not use set_false_path",
          kind: "excludes",
          pattern: "set_false_path",
        },
      ],
      solution: `path_a: setup fail on long combo — size data-path cells or split logic
path_b: hold fail on short path — buffer the data path (not a false path)
`,
    },
  },

  // ——— MMMC ———
  {
    slug: "mmmc-theory",
    track: "mmmc",
    kind: "theory",
    title: "Modes, corners, and analysis views",
    minutes: 16,
    level: "foundations",
    summary: "Functional vs scan vs test. RC corners, library corners, and views.",
    body: [
      "A delay corner is a PVT + RC + library snapshot (e.g. setup at slow/slow, hold at fast/fast).",
      "A constraint mode is an SDC personality: functional, scan, sleep. Different clocks and exceptions.",
      "An analysis view is (mode × corner). MMMC is the matrix of views the tool will actually time.",
      "You do not need every mode × every corner — you need the views that are physically meaningful and signoff-required.",
    ],
  },
  {
    slug: "mmmc-video",
    track: "mmmc",
    kind: "video",
    title: "Clocks in STA libraries",
    minutes: 21,
    level: "foundations",
    summary: "Cadence: how clocks are objects the MMMC matrix will time.",
    youtubeId: "M36sBRU8LpI",
    youtubeTitle: "Basic Static Timing Analysis: Timing Concepts — Clocks (Cadence)",
    body: [
      "Short session on clock objects. Pair it with the two-view MMMC practical.",
    ],
  },
  {
    slug: "mmmc-practical",
    track: "mmmc",
    kind: "practical",
    title: "Build a two-view MMMC matrix",
    minutes: 24,
    level: "working",
    difficulty: "medium",
    summary: "func/slow for setup, func/fast for hold — write the TCL.",
    body: [
      "Create library sets lib_slow and lib_fast.",
      "Create delay corners dc_slow and dc_fast.",
      "One functional constraint mode mode_func pointing at func.sdc.",
      "Analysis views view_setup (mode_func × dc_slow) and view_hold (mode_func × dc_fast).",
    ],
    checklist: [
      "create_library_set for slow and fast.",
      "create_delay_corner for both.",
      "create_constraint_mode mode_func.",
      "create_analysis_view for setup and hold.",
    ],
    problem: {
      language: "tcl",
      starter: `# Two-view MMMC: func/slow setup, func/fast hold

`,
      checks: [
        { id: "ls", label: "create_library_set", kind: "includes", pattern: "create_library_set" },
        { id: "dc", label: "create_delay_corner", kind: "includes", pattern: "create_delay_corner" },
        { id: "cm", label: "create_constraint_mode", kind: "includes", pattern: "create_constraint_mode" },
        { id: "av", label: "create_analysis_view", kind: "includes", pattern: "create_analysis_view" },
        { id: "slow", label: "names a slow corner/set", kind: "includes", pattern: "slow" },
        { id: "fast", label: "names a fast corner/set", kind: "includes", pattern: "fast" },
      ],
      solution: `create_library_set -name lib_slow -timing [list slow.lib]
create_library_set -name lib_fast -timing [list fast.lib]
create_rc_corner -name rc_typ
create_delay_corner -name dc_slow -library_set lib_slow -rc_corner rc_typ
create_delay_corner -name dc_fast -library_set lib_fast -rc_corner rc_typ
create_constraint_mode -name mode_func -sdc_files [list func.sdc]
create_analysis_view -name view_setup -constraint_mode mode_func -delay_corner dc_slow
create_analysis_view -name view_hold  -constraint_mode mode_func -delay_corner dc_fast
`,
    },
  },
  {
    slug: "mmmc-quiz",
    track: "mmmc",
    kind: "quiz",
    title: "MMMC quiz",
    minutes: 8,
    level: "foundations",
    passMark: 70,
    summary: "Views vs modes vs corners.",
    body: ["Pass mark 70%."],
    questions: [
      {
        id: "m1",
        prompt: "An analysis view is:",
        choices: [
          "Only a .lib file",
          "A pairing of constraint mode and delay corner",
          "A floorplan",
          "A UPF strategy",
        ],
        answer: 1,
        explain: "View = mode × corner.",
      },
      {
        id: "m2",
        prompt: "Scan mode typically needs its own SDC because:",
        choices: [
          "Libraries change metal stack",
          "Clocks, exceptions, and I/O differ from functional",
          "GDS is different",
          "STA cannot read two files",
        ],
        answer: 1,
        explain: "Test clocks and false paths differ from mission mode.",
      },
      {
        id: "m3",
        prompt: "Hold signoff is often timed at:",
        choices: ["Slow/slow only", "Fast/fast (and maybe other min corners)", "Typical only", "IR drop only"],
        answer: 1,
        explain: "Min delay / fast corners stress hold.",
      },
    ],
  },

  // ——— UPF ———
  {
    slug: "upf-theory",
    track: "upf",
    kind: "theory",
    title: "Power domains, isolation, retention",
    minutes: 18,
    level: "working",
    summary: "IEEE 1801 intent vs implementation cells.",
    body: [
      "A power domain groups instances that share a supply net and power-down behavior.",
      "Isolation clamps outputs of a domain that can be off so receivers do not see X or crowbar.",
      "Retention saves flop state across power-down (save/restore pins or always-on shadow).",
      "Level shifters sit on voltage crossings. Switches cut the supply. Strategies in UPF declare where, not always which cell — implementation binds cells later.",
    ],
  },
  {
    slug: "upf-practical",
    track: "upf",
    kind: "practical",
    title: "Two-domain UPF",
    minutes: 28,
    level: "working",
    difficulty: "medium",
    summary: "Always-on top + switchable island, isolation on the crossing.",
    body: [
      "create_power_domain PD_TOP (already top) and PD_ISLAND for the switchable island.",
      "set_isolation on island → top outputs.",
      "add_power_state (or create_power_state) for ON and SLEEP.",
    ],
    checklist: [
      "Two create_power_domain commands.",
      "Isolation strategy named.",
      "At least two power states.",
    ],
    problem: {
      language: "tcl",
      starter: `# PD_TOP always-on, PD_ISLAND switchable, isolate island outputs

`,
      checks: [
        { id: "pd", label: "create_power_domain", kind: "includes", pattern: "create_power_domain" },
        { id: "top", label: "PD_TOP defined", kind: "includes", pattern: "PD_TOP" },
        { id: "isl", label: "PD_ISLAND defined", kind: "includes", pattern: "PD_ISLAND" },
        { id: "iso", label: "set_isolation", kind: "includes", pattern: "set_isolation" },
        {
          id: "st",
          label: "power state ON or SLEEP",
          kind: "regex",
          pattern: "ON|SLEEP|add_power_state|create_power_state",
        },
      ],
      solution: `create_power_domain PD_TOP
create_power_domain PD_ISLAND -elements {u_island}
set_isolation iso_island -domain PD_ISLAND -clamp_value 0 -applies_to outputs
add_power_state PD_ISLAND -state ON    -supply {VDD 0.8}
add_power_state PD_ISLAND -state SLEEP -supply {VDD off}
`,
    },
  },
  {
    slug: "upf-quiz",
    track: "upf",
    kind: "quiz",
    title: "UPF quiz",
    minutes: 8,
    level: "working",
    passMark: 70,
    summary: "Isolation vs retention vs shifter.",
    body: ["Pass mark 70%."],
    questions: [
      {
        id: "u1",
        prompt: "Isolation is required when:",
        choices: [
          "Two clocks are async",
          "A domain can power down and still drive live logic",
          "Hold is failing",
          "You have only one supply",
        ],
        answer: 1,
        explain: "Off-domain outputs must be clamped.",
      },
      {
        id: "u2",
        prompt: "Retention cells are for:",
        choices: [
          "Keeping flop state across power-gate",
          "Fixing setup",
          "CDC",
          "Scan compression",
        ],
        answer: 0,
        explain: "Save/restore or always-on shadow flops.",
      },
      {
        id: "u3",
        prompt: "Level shifters are for:",
        choices: ["Same-voltage isolation", "Voltage-domain crossings", "Clock gating", "Reset sync"],
        answer: 1,
        explain: "Electrical voltage translation, not just clamp.",
      },
    ],
  },

  // ——— CDC ———
  {
    slug: "cdc-theory",
    track: "cdc",
    kind: "theory",
    title: "Clock-domain crossing essentials",
    minutes: 16,
    level: "working",
    summary: "Synchronizers, pulses, and gray codes.",
    body: [
      "A bit from clock A to clock B is metastable unless synchronized. Two (or more) flops in B with no combo between them is the standard 2FF synchronizer.",
      "Multi-bit buses cannot use independent 2FF per bit — they can go incoherent. Use gray code counters, handshake, or async FIFO.",
      "Pulses narrower than the destination period can vanish. Stretch or handshake.",
      "SDC must match: async clock groups, and do not false-path the synchronizer in a way that hides the first flop’s setup to the sync chain incorrectly — follow your CDC methodology.",
    ],
  },
  {
    slug: "cdc-video",
    track: "cdc",
    kind: "video",
    title: "STA clocks and crossings",
    minutes: 16,
    level: "working",
    summary: "Cadence: timing paths — the graph CDC exceptions sit on.",
    youtubeId: "Y-tP22Z6aLw",
    youtubeTitle: "Basic Static Timing Analysis: Timing Concepts — Timing Paths (Cadence)",
    body: [
      "Use this to picture launch/capture clocks before writing async clock groups.",
    ],
  },
  {
    slug: "cdc-practical",
    track: "cdc",
    kind: "practical",
    title: "Constrain two async clocks",
    minutes: 20,
    level: "working",
    difficulty: "medium",
    summary: "Clock groups + named clocks, not a design-wide false path.",
    body: [
      "clk_a period 2.0 on port clka. clk_b period 4.0 on port clkb.",
      "set_clock_groups -asynchronous -group {clk_a} -group {clk_b}.",
      "Never set_false_path from * to *.",
    ],
    checklist: [
      "Two create_clock commands.",
      "set_clock_groups -asynchronous.",
      "No global star false path.",
    ],
    problem: {
      language: "tcl",
      starter: `# two async clocks — groups, not star false path

`,
      checks: [
        { id: "a", label: "clk_a defined", kind: "includes", pattern: "clk_a" },
        { id: "b", label: "clk_b defined", kind: "includes", pattern: "clk_b" },
        { id: "cc", label: "create_clock used twice", kind: "regex", pattern: "create_clock[\\s\\S]*create_clock" },
        {
          id: "g",
          label: "set_clock_groups -asynchronous",
          kind: "regex",
          pattern: "set_clock_groups[\\s\\S]*-asynchronous",
        },
        {
          id: "star",
          label: "no set_false_path -from * -to *",
          kind: "excludes",
          pattern: "set_false_path -from * -to *",
        },
      ],
      solution: `create_clock -name clk_a -period 2.0 [get_ports clka]
create_clock -name clk_b -period 4.0 [get_ports clkb]
set_clock_groups -asynchronous -group {clk_a} -group {clk_b}
`,
    },
  },
  {
    slug: "cdc-sync-practical",
    track: "cdc",
    kind: "practical",
    title: "2FF synchronizer",
    minutes: 18,
    level: "working",
    difficulty: "medium",
    summary: "Two flops in series, no combo between them, async reset.",
    body: [
      "s1 samples d, s2 samples s1, q = s2. Both flops share clk and rst_n.",
    ],
    checklist: [
      "Two registers (s1 and s2).",
      "s2 <= s1 (no combo on that hop).",
      "Async reset both to 0.",
    ],
    problem: {
      language: "verilog",
      starter: `module sync2ff (
  input  clk,
  input  rst_n,
  input  d,
  output q
);
  // TODO: 2FF synchronizer

endmodule
`,
      checks: [
        { id: "alw", label: "always block", kind: "includes", pattern: "always" },
        { id: "s1", label: "first stage s1", kind: "includes", pattern: "s1" },
        { id: "s2", label: "second stage s2", kind: "includes", pattern: "s2" },
        { id: "chain", label: "s2 follows s1", kind: "regex", pattern: "s2\\s*<=\\s*s1" },
        { id: "q", label: "output q from s2", kind: "regex", pattern: "assign\\s+q\\s*=\\s*s2|q\\s*<=\\s*s2" },
      ],
      solution: `module sync2ff (
  input  clk,
  input  rst_n,
  input  d,
  output q
);
  reg s1, s2;
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      s1 <= 1'b0;
      s2 <= 1'b0;
    end else begin
      s1 <= d;
      s2 <= s1;
    end
  end
  assign q = s2;
endmodule
`,
    },
  },
  {
    slug: "cdc-quiz",
    track: "cdc",
    kind: "quiz",
    title: "CDC quiz",
    minutes: 8,
    level: "working",
    passMark: 70,
    summary: "Synchronizers and buses.",
    body: ["Pass mark 70%."],
    questions: [
      {
        id: "c1",
        prompt: "A 2FF synchronizer is for:",
        choices: [
          "Multi-bit data buses without protocol",
          "Single-bit (or gray) signals into another clock",
          "Hold fix",
          "Scan",
        ],
        answer: 1,
        explain: "Independent bits of a bus can skew; use FIFO/handshake/gray.",
      },
      {
        id: "c2",
        prompt: "Why gray code for async counters?",
        choices: [
          "Fewer gates",
          "Only one bit changes per increment, so sampled value is adjacent",
          "Faster STA",
          "No clocks needed",
        ],
        answer: 1,
        explain: "Single-bit change avoids incoherent multi-bit samples.",
      },
      {
        id: "c3",
        prompt: "A pulse CDC hazard is:",
        choices: [
          "Pulse shorter than dest period never sampled",
          "Always a hold fail",
          "IR drop",
          "Antenna DRC",
        ],
        answer: 0,
        explain: "Need stretch or req/ack.",
      },
    ],
  },
];

export const LEARN_SESSIONS: LearnSession[] = [
  ...LEARN_SESSION_CORE,
  ...LEARN_LAYER_SESSIONS,
];

export function sessionBySlug(slug: string): LearnSession | undefined {
  return LEARN_SESSIONS.find((s) => s.slug === slug);
}

export function sessionsForTrack(trackId: string): LearnSession[] {
  return LEARN_SESSIONS.filter((s) => s.track === trackId);
}

export function sessionsForKind(kind: LearnKind): LearnSession[] {
  return LEARN_SESSIONS.filter((s) => s.kind === kind);
}

export function trackById(id: string): LearnTrack | undefined {
  return LEARN_TRACKS.find((t) => t.id === id);
}

/** TutorialsPoint-style course URL: /vlsi/learn/c/tcl or /vlsi/learn/c/tcl/tcl-beginner */
export function learnCourseHref(trackId: string, slug?: string): string {
  if (slug) return `/vlsi/learn/c/${trackId}/${slug}`;
  return `/vlsi/learn/c/${trackId}`;
}

export function shortLessonTitle(session: LearnSession): string {
  if (session.kind === "quiz") return "Quiz";
  if (session.kind === "test") return "Test";
  if (session.kind === "video") return "Video";
  let t = session.title
    .replace(/^(Beginner|Standard|Expert|Master)(\s+Practical)?:\s*/i, "")
    .replace(/^Beginner Practical:\s*/i, "Lab: ");
  const parts = t.split(/\s+[—–]\s+/);
  if (parts.length > 1 && parts[1].length > 3 && parts[1].length <= 52) t = parts[1];
  if (t.length > 52) t = `${t.slice(0, 50)}…`;
  return t;
}

export function topicIndexLabel(trackTitle: string, session: LearnSession): string {
  return `${trackTitle} - ${shortLessonTitle(session)}`;
}

export function isLearnKind(value: string | null): value is LearnKind {
  return (
    value === "theory" ||
    value === "video" ||
    value === "practical" ||
    value === "quiz" ||
    value === "test"
  );
}

export function groupById(id: string): LearnGroup | undefined {
  return LEARN_GROUPS.find((g) => g.id === id);
}

export function tracksForGroup(groupId: string): LearnTrack[] {
  return LEARN_TRACKS.filter((t) => t.group === groupId);
}

export function orderedSessionsForTrack(trackId: string): LearnSession[] {
  const list = sessionsForTrack(trackId);
  return [...list].sort((a, b) => {
    const dl = LEARN_LAYER_ORDER.indexOf(sessionLayer(a)) - LEARN_LAYER_ORDER.indexOf(sessionLayer(b));
    if (dl !== 0) return dl;
    return LEARN_KIND_ORDER.indexOf(a.kind) - LEARN_KIND_ORDER.indexOf(b.kind);
  });
}

export function sessionsForTrackLayer(trackId: string, layer: LearnLayer): LearnSession[] {
  return orderedSessionsForTrack(trackId).filter((s) => sessionLayer(s) === layer);
}

export function firstSessionOfTrack(trackId: string): LearnSession | undefined {
  return orderedSessionsForTrack(trackId)[0];
}
