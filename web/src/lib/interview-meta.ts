/**
 * Interview Masterclass — client-safe metadata (no answer bank).
 * Full Q&A lives in vlsi-interview-masterclass-data.ts (API / server only).
 */

export type SemiconductorCompany =
  | "nvidia"
  | "qualcomm"
  | "intel"
  | "apple"
  | "amd"
  | "texas-instruments"
  | "broadcom"
  | "mediatek"
  | "synopsys"
  | "cadence"
  | "google-silicon"
  | "arm";

export type InterviewDomain =
  | "physical-design"
  | "static-timing-analysis"
  | "design-verification"
  | "clock-domain-crossing"
  | "synthesis-sdc"
  | "low-power-upf"
  | "rtl-verilog-architecture"
  | "dft-atpg"
  | "power-integrity-ir"
  | "aptitude-quantitative"
  | "logical-reasoning-puzzles";

export interface InterviewQuestion {
  id: string;
  company?: SemiconductorCompany;
  companyName?: string;
  domain: InterviewDomain;
  domainName: string;
  role: string;
  difficulty: "Medium" | "Hard" | "Staff / Principal";
  round:
    | "Technical Phone Screen"
    | "Onsite Technical Round 1"
    | "Onsite Deep-Dive"
    | "Hiring Manager Round";
  question: string;
  shortSummary: string;
  detailedAnswer: string;
  tclOrVerilogSnippet?: {
    lang: "tcl" | "verilog" | "sdc" | "systemverilog" | "c" | "math";
    code: string;
  };
  commonPitfalls: string[];
  interviewerFollowups: string[];
  tags: string[];
  isFreeSample?: boolean;
}

/** Catalog row shipped to the browser — never includes solutions. */
export type PublicInterviewQuestion = Omit<
  InterviewQuestion,
  "detailedAnswer" | "tclOrVerilogSnippet" | "commonPitfalls" | "interviewerFollowups"
> & {
  hasFullSolution?: boolean;
};

export function toPublicInterviewQuestion(
  q: InterviewQuestion
): PublicInterviewQuestion {
  const {
    detailedAnswer: _a,
    tclOrVerilogSnippet: _s,
    commonPitfalls: _p,
    interviewerFollowups: _f,
    ...rest
  } = q;
  return rest;
}

export interface CompanyInfo {
  id: SemiconductorCompany;
  name: string;
  tagline: string;
  accentColor: string;
  badge: string;
  focusAreas: string[];
}

export const COMPANIES_METADATA: CompanyInfo[] = [
  {
    id: "nvidia",
    name: "Nvidia",
    tagline: "GPU Tensor Core Architecture, High-Speed CTS, Extreme Frequency Physical Design & DV",
    accentColor: "#76b900",
    badge: "Top Recruiter",
    focusAreas: ["Deep PnR", "Useful Skew", "Custom Low-Latency Clock Meshes", "UVM VIPs", "Hardware Puzzles"],
  },
  {
    id: "qualcomm",
    name: "Qualcomm",
    tagline: "Snapdragon Ultra-Low Power Mobile SoC, Multi-Voltage UPF, Complex CDC & Screening Aptitude",
    accentColor: "#3253dc",
    badge: "High Hiring Volume",
    focusAreas: ["UPF 1801 Power Gating", "Async FIFOs", "Aptitude & Probability", "UVM Factory/RAL", "MMMC Signoff"],
  },
  {
    id: "apple",
    name: "Apple Silicon",
    tagline: "M-Series & A-Series Custom Microarchitecture, Advanced Sub-3nm Nodes & High Density PnR",
    accentColor: "#a3a3a3",
    badge: "Elite Signoff",
    focusAreas: ["FinFET Self-Heating", "PBA vs GBA", "Dynamic IR Drop", "SVA Assertions", "Clock Dividers"],
  },
  {
    id: "intel",
    name: "Intel",
    tagline: "High-Performance Compute, RibbonFET / PowerVia Backside Power Delivery, STA & DV",
    accentColor: "#0071c5",
    badge: "Core Architecture",
    focusAreas: ["Backside PDN", "OCV / POCV Derating", "Hold Closure", "UVM RAL", "Bitwise Math"],
  },
  {
    id: "amd",
    name: "AMD",
    tagline: "Zen & RDNA Chiplet Architectures, 3D V-Cache Interconnects & High-Speed Synthesis",
    accentColor: "#ed1c24",
    badge: "Chiplet Leader",
    focusAreas: ["Die-to-Die Interconnects", "Logical Effort", "Clock Gating", "Logical Puzzles", "SystemVerilog"],
  },
  {
    id: "texas-instruments",
    name: "Texas Instruments",
    tagline: "Mixed-Signal ASIC, Automotive Reliability (AEC-Q100) & Power Management",
    accentColor: "#cc0000",
    badge: "Analog & Mixed-Signal",
    focusAreas: ["Substrate Noise Coupling", "Pipelining Throughput", "Level Shifters", "Electromigration"],
  },
  {
    id: "broadcom",
    name: "Broadcom",
    tagline: "Ultra-High Bandwidth Networking Switch Silicon (Tomahawk) & SerDes Physical Design",
    accentColor: "#cc092f",
    badge: "Networking Silicon",
    focusAreas: ["51.2T Switch PnR", "Long Net Repeater Insertion", "Bit Manipulation", "Crosstalk Glitch"],
  },
  {
    id: "arm",
    name: "Arm",
    tagline: "Cortex & Neoverse Core Hardening, Standard Cell Library Tuning & Synthesis POPs",
    accentColor: "#0091bd",
    badge: "IP Architecture",
    focusAreas: ["Multi-Vt Cell Swapping", "Power-Performance-Area (PPA)", "Synthesis Constraints", "UVM Agents"],
  },
];

export const DOMAINS_METADATA: {
  id: InterviewDomain;
  title: string;
  countHint: string;
  icon: string;
  comingSoon?: boolean;
}[] = [
  { id: "physical-design", title: "Physical Design (Floorplan, CTS, PnR)", countHint: "25 Questions · Floorplan, Macro Halos, CTS, Useful Skew, Routing", icon: "Layers" },
  { id: "static-timing-analysis", title: "Static Timing Analysis (STA & SI)", countHint: "25 Questions · Setup, Hold, OCV/POCV, CPPR, PBA, ITD", icon: "Clock" },
  { id: "design-verification", title: "Design Verification (DV / UVM & SVA)", countHint: "25 Questions · UVM Factory/RAL, SVA Assertions, Coverage, Sched", icon: "CheckCircle2" },
  { id: "aptitude-quantitative", title: "Quantitative Aptitude & Engineering Math", countHint: "25 Questions · Probability, Bayes, Combinatorics, BER, 2's Comp", icon: "Calculator" },
  { id: "logical-reasoning-puzzles", title: "Logical Reasoning & Hardware Puzzles", countHint: "25 Questions · 1000 Wine Bottles, 25 Horses, Clock Div, Bitwise", icon: "Lightbulb" },
  { id: "clock-domain-crossing", title: "Clock Domain Crossing & Metastability", countHint: "25 Questions · 2-FF Sync, MTBF, Async FIFO, Gray Pointer", icon: "Shuffle" },
  { id: "synthesis-sdc", title: "Logic Synthesis & SDC Constraints", countHint: "36 Questions · Clocks, Gen Clocks, Multicycle, False Paths", icon: "FileCode2" },
  { id: "low-power-upf", title: "Low Power UPF & Multi-Voltage", countHint: "25 Questions · Isolation, Level Shifters, Power Switches, Retention", icon: "Zap" },
  { id: "rtl-verilog-architecture", title: "Verilog & Digital Architecture", countHint: "25 Questions · FSM, Pipelining, Hazard, Skid Buffer, Round-Robin", icon: "Cpu" },
  { id: "power-integrity-ir", title: "Power Integrity & Dynamic IR Drop", countHint: "25 Questions · Static IR, L·di/dt, Decap Radius, EM Black Eq", icon: "Activity" },
  { id: "dft-atpg", title: "DFT, Scan Chains & Testability", countHint: "25 Questions · Muxed-D, LOC/LOS, Compression, IEEE 1500/1687", icon: "ShieldCheck" },
];

export const INTERVIEW_BUNDLE_PRICING = {
  id: "interview_masterclass_lifetime",
  title: "VLSI Top-Tier Semiconductor Interview Masterclass Bundle",
  tagline:
    "One-Time Payment · Lifetime Access · Staff-level depth from Nvidia, Qualcomm, Intel, Apple & AMD style rounds",
  originalPrice: "₹6,999",
  offerPrice: "₹2,499",
  offerPriceUsd: "$29",
  currency: "INR",
  badge: "One-Time Lifetime Access",
  stats: {
    totalQuestions: "280+ Deep Staff-Level Problems",
    topCompanies: "8 Semiconductor Leaders (style coverage)",
    detailedSolutions: "Step-by-step Tcl / math / pitfall writeups",
    mockSimulators: "Domain filters · Free previews · Growing bank",
  },
  benefits: [
    "Lifetime access to 280+ Staff/Principal questions spanning DV, RTL, IR Drop, Aptitude, Puzzles, Synthesis/SDC, STA, PnR, UPF, CDC, and DFT.",
    "Company-style framing inspired by Nvidia, Qualcomm, Apple, Intel, AMD, TI, Broadcom, and Arm interview loops.",
    "Full mathematical proofs, KaTeX derivations, and production tool commands (Genus, Innovus, Tempus, PrimeTime, UVM).",
    "Physical Design & Signoff deep dives: path-group triage, CTS useful skew, UPF 1801, scan DFT.",
    "Practice handoff into Ace-Seek studios (SDC / Timing / Power / RTL) from matching domains.",
    "Free future updates whenever new questions are added — no subscription.",
  ],
};

export function studioPracticeForInterviewDomain(
  domain: InterviewDomain
): { href: string; label: string } | null {
  switch (domain) {
    case "synthesis-sdc":
    case "clock-domain-crossing":
      return { href: "/vlsi/sdc-studio", label: "Practice in SDC Studio" };
    case "static-timing-analysis":
      return { href: "/vlsi/timing-studio", label: "Practice in Timing Studio" };
    case "low-power-upf":
    case "power-integrity-ir":
      return { href: "/vlsi/power-studio", label: "Practice in Power Studio" };
    case "physical-design":
      return { href: "/vlsi/mmmc-studio", label: "Open MMMC Studio" };
    case "rtl-verilog-architecture":
      return { href: "/vlsi/rtl-lab", label: "Practice in RTL Lab" };
    case "design-verification":
      return { href: "/vlsi/learn", label: "Related DV courses in Learn Hub" };
    case "dft-atpg":
      return { href: "/vlsi/learn", label: "Related DFT courses in Learn Hub" };
    case "aptitude-quantitative":
    case "logical-reasoning-puzzles":
      return null;
    default:
      return { href: "/vlsi/learn", label: "Related Learn Hub courses" };
  }
}
