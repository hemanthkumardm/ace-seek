/**
 * VLSI AI Intelligent NLP & Typo-Resilient Semantic Matching Engine
 * 
 * Provides:
 * 1. Levenshtein edit-distance calculation & fuzzy token matching
 * 2. Specialized VLSI engineering spelling autocorrect & normalization
 * 3. Multi-class semantic intent scoring with weighted domain vectors
 * 4. Resilient matching for space mismatches, symbol variants, and typos
 */

// Canonical VLSI dictionary keywords for fuzzy matching (min length >= 4)
export const VLSI_VOCABULARY = [
  "check",
  "design",
  "timing",
  "synthesis",
  "unresolved",
  "driver",
  "multiple",
  "combinational",
  "loop",
  "feedback",
  "undriven",
  "floating",
  "assigns",
  "assign",
  "tieoff",
  "tieoffs",
  "constant",
  "liberty",
  "waveform",
  "unconstrained",
  "external",
  "delay",
  "transition",
  "slew",
  "load",
  "capacitance",
  "setup",
  "hold",
  "slack",
  "skew",
  "latency",
  "multicycle",
  "gating",
  "clock",
  "asynchronous",
  "synchronizer",
  "metastability",
  "electromigration",
  "black",
  "equation",
  "density",
  "level",
  "shifter",
  "crowbar",
  "leakage",
  "inversion",
  "temperature",
  "dependence",
  "cppr",
  "crpr",
  "pessimism",
  "fifo",
  "depth",
  "innovus",
  "genus",
  "tempus",
  "voltus",
  "openroad",
  "synopsys",
  "cadence",
  "macro",
  "memory",
  "register",
  "flipflop",
  "cold",
  "hot",
] as const;

// Common typo & phonetic lookup map
const COMMON_TYPOS: Record<string, string> = {
  // check / design
  chk: "check",
  chek: "check",
  chekc: "check",
  chck: "check",
  chke: "check",
  dsign: "design",
  desgn: "design",
  dezign: "design",
  desing: "design",
  dsgn: "design",

  // unresolved / reference / module
  unresovled: "unresolved",
  unresolvd: "unresolved",
  unresoled: "unresolved",
  unresolvedd: "unresolved",
  unres: "unresolved",
  unresolv: "unresolved",
  modul: "module",
  modle: "module",
  moduls: "modules",
  refrnce: "reference",
  refrence: "reference",
  blckbox: "blackbox",
  blackbx: "blackbox",

  // synthesis / compile
  synth: "synthesis",
  synthsis: "synthesis",
  sinthesis: "synthesis",
  syntehsis: "synthesis",
  synthesise: "synthesis",
  synthesize: "synthesis",
  syn: "synthesis",

  // timing / lint / clock
  tming: "timing",
  timng: "timing",
  timeing: "timing",
  timin: "timing",
  time: "timing",
  clk: "clock",
  clks: "clock",
  clck: "clock",
  clocks: "clock",
  period: "period",
  perid: "period",
  freq: "frequency",
  frequncy: "frequency",
  lnt: "lint",
  lintt: "lint",
  linnt: "lint",
  independant: "independent",

  // multiple driver / contention
  multple: "multiple",
  multi: "multiple",
  miltiple: "multiple",
  drivr: "driver",
  drivrs: "driver",
  multidriver: "multiple_driver",
  multidrivr: "multiple_driver",
  contenshion: "contention",
  crowbr: "crowbar",

  // combinational / loop
  combonational: "combinational",
  combinatorial: "combinational",
  comb: "combinational",
  combo: "combinational",
  combi: "combinational",
  combina: "combinational",
  lop: "loop",
  lops: "loop",
  loopp: "loop",
  feedbck: "feedback",

  // undriven / floating
  undrivn: "undriven",
  undrived: "undriven",
  floting: "floating",
  floatin: "floating",

  // assigns / continuous
  asigns: "assigns",
  asign: "assign",
  assings: "assigns",
  continuos: "continuous",
  continious: "continuous",

  // tieoff / constant
  tieof: "tieoff",
  tieofs: "tieoffs",
  tioff: "tieoff",
  tioffs: "tieoffs",
  tieh: "tiehi",
  tiel: "tielo",
  const: "constant",
  constnt: "constant",

  // liberty / libraries
  libery: "liberty",
  libert: "liberty",
  leberty: "liberty",
  lib: "liberty",
  libs: "liberty",

  // setup / hold / skew
  setp: "setup",
  stup: "setup",
  setpu: "setup",
  hld: "hold",
  hol: "hold",
  holdd: "hold",
  skw: "skew",
  skeww: "skew",
  latncy: "latency",

  // electromigration / reliability
  electromigratn: "electromigration",
  electromigrtion: "electromigration",
  elctromigration: "electromigration",
  em: "electromigration",
  mttf: "mttf",

  // cppr / ocv
  crpr: "cppr",
  pesimism: "pessimism",
  reconvergence: "reconvergence",

  // level shifter / upf
  shiftr: "shifter",
  voltag: "voltage",
  voltg: "voltage",
  pwr: "power",
};

/**
 * Calculates Levenshtein edit distance between two strings
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Normalized similarity score between 0.0 (totally different) and 1.0 (exact match)
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshtein(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Finds the closest matching canonical VLSI word for a token if distance is <= maxDist
 */
export function findClosestVocabWord(token: string, minSimilarity = 0.72): string | null {
  if (token.length < 3) return null;

  // Direct typo dictionary match
  if (COMMON_TYPOS[token]) {
    return COMMON_TYPOS[token];
  }

  let bestMatch: string | null = null;
  let bestSim = 0;

  for (const word of VLSI_VOCABULARY) {
    const sim = stringSimilarity(token, word);
    if (sim > bestSim && sim >= minSimilarity) {
      bestSim = sim;
      bestMatch = word;
    }
  }

  return bestMatch;
}

export interface TypoCorrection {
  original: string;
  corrected: string;
}

export interface NormalizedQuery {
  raw: string;
  cleaned: string;
  tokens: string[];
  canonicalTokens: Set<string>;
  corrections: TypoCorrection[];
}

/**
 * Parses, cleans, corrects typos, and normalizes a user query
 */
export function normalizeVlsiQuery(rawQuery: string): NormalizedQuery {
  // Normalize symbols: underscores and hyphens into spaces, remove punctuation
  const cleaned = rawQuery
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const rawTokens = cleaned.split(" ").filter((t) => t.length > 0);
  const canonicalTokens = new Set<string>();
  const corrections: TypoCorrection[] = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];

    // Check bigrams first (e.g. "check design" -> "check_design")
    if (i < rawTokens.length - 1) {
      const bigram = `${token} ${rawTokens[i + 1]}`;
      if (bigram === "check design") {
        canonicalTokens.add("check_design");
      } else if (bigram === "check timing") {
        canonicalTokens.add("check_timing");
      } else if (bigram === "multiple driver" || bigram === "multiple drivers") {
        canonicalTokens.add("multiple_driver");
      } else if (bigram === "level shifter") {
        canonicalTokens.add("level_shifter");
      } else if (bigram === "clock gating") {
        canonicalTokens.add("clock_gating");
      }
    }

    // Direct match with dictionary
    if (COMMON_TYPOS[token]) {
      const fixed = COMMON_TYPOS[token];
      if (fixed !== token) {
        corrections.push({ original: token, corrected: fixed });
      }
      canonicalTokens.add(fixed);
      continue;
    }

    // Fuzzy match against canonical vocabulary
    const closest = findClosestVocabWord(token);
    if (closest) {
      if (closest !== token) {
        corrections.push({ original: token, corrected: closest });
      }
      canonicalTokens.add(closest);
    } else {
      canonicalTokens.add(token);
    }
  }

  return {
    raw: rawQuery,
    cleaned,
    tokens: rawTokens,
    canonicalTokens,
    corrections,
  };
}

export interface IntentMatch {
  intentId: string;
  score: number;
  label: string;
}

interface IntentDefinition {
  id: string;
  label: string;
  mustIncludeAny?: string[];
  keyTerms: { term: string; weight: number }[];
}

const INTENT_DEFINITIONS: IntentDefinition[] = [
  {
    id: "CHECK_DESIGN_UNRESOLVED",
    label: "check_design -unresolved (Missing Modules & Black-Boxes)",
    mustIncludeAny: ["unresolved", "missing"],
    keyTerms: [
      { term: "unresolved", weight: 3.5 },
      { term: "check", weight: 1.0 },
      { term: "design", weight: 1.0 },
      { term: "check_design", weight: 2.0 },
      { term: "missing", weight: 2.0 },
      { term: "module", weight: 1.5 },
      { term: "blackbox", weight: 2.0 },
      { term: "liberty", weight: 1.5 },
      { term: "synthesis", weight: 1.0 },
      { term: "reference", weight: 2.0 },
    ],
  },
  {
    id: "CHECK_DESIGN_MULTIPLE_DRIVER",
    label: "check_design -multiple_driver (Bus Contention)",
    mustIncludeAny: ["multiple", "multiple_driver", "contention", "multidriver"],
    keyTerms: [
      { term: "multiple_driver", weight: 3.5 },
      { term: "multiple", weight: 1.5 },
      { term: "driver", weight: 1.5 },
      { term: "contention", weight: 2.5 },
      { term: "crowbar", weight: 2.0 },
      { term: "short", weight: 1.5 },
      { term: "check", weight: 1.0 },
      { term: "design", weight: 1.0 },
      { term: "check_design", weight: 2.0 },
    ],
  },
  {
    id: "CHECK_DESIGN_COMBO_LOOPS",
    label: "check_design -combo_loops (Feedback Cycles)",
    mustIncludeAny: ["loop", "combinational", "feedback"],
    keyTerms: [
      { term: "loop", weight: 2.5 },
      { term: "combinational", weight: 2.0 },
      { term: "feedback", weight: 2.5 },
      { term: "cycle", weight: 1.5 },
      { term: "check", weight: 1.0 },
      { term: "design", weight: 1.0 },
      { term: "check_design", weight: 2.0 },
    ],
  },
  {
    id: "CHECK_DESIGN_ASSIGNS",
    label: "check_design -assigns (Continuous Assigns Removal)",
    mustIncludeAny: ["assigns", "assign", "remove_assigns"],
    keyTerms: [
      { term: "assigns", weight: 3.5 },
      { term: "assign", weight: 2.5 },
      { term: "continuous", weight: 1.5 },
      { term: "buffer", weight: 1.5 },
      { term: "check", weight: 1.0 },
      { term: "design", weight: 1.0 },
      { term: "check_design", weight: 2.0 },
    ],
  },
  {
    id: "CHECK_DESIGN_TIEOFFS",
    label: "check_design -constant & add_tieoffs (Pad & Rail Ties)",
    mustIncludeAny: ["tieoff", "tieoffs", "constant", "tiehi", "tielo"],
    keyTerms: [
      { term: "tieoff", weight: 3.0 },
      { term: "tieoffs", weight: 3.0 },
      { term: "constant", weight: 2.5 },
      { term: "tiehi", weight: 2.5 },
      { term: "tielo", weight: 2.5 },
      { term: "pad", weight: 1.5 },
      { term: "check", weight: 1.0 },
      { term: "design", weight: 1.0 },
    ],
  },
  {
    id: "CHECK_DESIGN_GENERAL",
    label: "check_design Structural Netlist Audit Overview",
    mustIncludeAny: ["check_design", "design", "structural"],
    keyTerms: [
      { term: "check", weight: 1.5 },
      { term: "design", weight: 1.5 },
      { term: "check_design", weight: 3.0 },
      { term: "structural", weight: 2.0 },
      { term: "lint", weight: 1.5 },
      { term: "synthesis", weight: 1.0 },
    ],
  },
  {
    id: "CHECK_TIMING_LINT",
    label: "check_timing (Constraint Hygiene & Timing Lint)",
    mustIncludeAny: ["check_timing", "timing", "lint"],
    keyTerms: [
      { term: "check", weight: 1.0 },
      { term: "timing", weight: 2.0 },
      { term: "check_timing", weight: 3.5 },
      { term: "lint", weight: 2.5 },
      { term: "unconstrained", weight: 2.0 },
      { term: "waveform", weight: 2.0 },
      { term: "delay", weight: 1.0 },
      { term: "transition", weight: 1.5 },
      { term: "load", weight: 1.5 },
    ],
  },
  {
    id: "ELECTROMIGRATION",
    label: "Electromigration & Black's Equation",
    mustIncludeAny: ["electromigration", "black", "mttf"],
    keyTerms: [
      { term: "electromigration", weight: 4.0 },
      { term: "black", weight: 3.0 },
      { term: "equation", weight: 2.0 },
      { term: "density", weight: 1.5 },
      { term: "mttf", weight: 2.5 },
      { term: "void", weight: 1.5 },
    ],
  },
  {
    id: "CPPR_OCV",
    label: "Common Path Pessimism Removal (CPPR) & Clock Skew",
    mustIncludeAny: ["cppr", "crpr", "pessimism"],
    keyTerms: [
      { term: "cppr", weight: 4.0 },
      { term: "crpr", weight: 4.0 },
      { term: "pessimism", weight: 2.5 },
      { term: "common", weight: 1.5 },
      { term: "skew", weight: 1.5 },
      { term: "derate", weight: 1.5 },
      { term: "clock", weight: 1.0 },
    ],
  },
  {
    id: "ITD_TEMPERATURE",
    label: "Inverted Temperature Dependence (ITD)",
    mustIncludeAny: ["itd", "temperature", "dependence"],
    keyTerms: [
      { term: "itd", weight: 4.0 },
      { term: "temperature", weight: 2.5 },
      { term: "dependence", weight: 2.5 },
      { term: "inverted", weight: 2.5 },
      { term: "cold", weight: 1.5 },
      { term: "delay", weight: 1.0 },
    ],
  },
  {
    id: "FIFO_DEPTH",
    label: "Asynchronous Dual-Clock FIFO Depth Calculation",
    mustIncludeAny: ["fifo", "depth"],
    keyTerms: [
      { term: "fifo", weight: 3.5 },
      { term: "depth", weight: 3.5 },
      { term: "asynchronous", weight: 2.0 },
      { term: "burst", weight: 2.0 },
      { term: "clock", weight: 1.0 },
    ],
  },
  {
    id: "LEVEL_SHIFTER",
    label: "Level Shifter & Crowbar Leakage Prevention",
    mustIncludeAny: ["shifter", "level", "crowbar"],
    keyTerms: [
      { term: "shifter", weight: 3.0 },
      { term: "level_shifter", weight: 4.0 },
      { term: "level", weight: 2.0 },
      { term: "crowbar", weight: 3.0 },
      { term: "leakage", weight: 1.5 },
      { term: "voltage", weight: 1.5 },
    ],
  },
  {
    id: "CLOCK_GATING",
    label: "Integrated Clock Gating (ICG) Architecture & Setup",
    mustIncludeAny: ["gating", "icg"],
    keyTerms: [
      { term: "gating", weight: 3.0 },
      { term: "clock_gating", weight: 4.0 },
      { term: "icg", weight: 3.5 },
      { term: "latch", weight: 2.0 },
      { term: "enable", weight: 1.5 },
      { term: "hazard", weight: 1.5 },
    ],
  },
  {
    id: "SETUP_HOLD_STA",
    label: "Static Timing Analysis: Setup & Hold Formulation",
    mustIncludeAny: ["setup", "hold"],
    keyTerms: [
      { term: "setup", weight: 3.5 },
      { term: "hold", weight: 3.5 },
      { term: "slack", weight: 2.0 },
      { term: "skew", weight: 1.5 },
      { term: "sta", weight: 2.0 },
      { term: "timing", weight: 1.5 },
      { term: "clock", weight: 1.5 },
      { term: "period", weight: 2.0 },
      { term: "independent", weight: 2.5 },
    ],
  },
];

/**
 * Computes semantic similarity across all domain intents
 */
export function classifyVlsiQuery(rawQuery: string): {
  normalized: NormalizedQuery;
  topIntent: IntentMatch | null;
  allMatches: IntentMatch[];
} {
  const normalized = normalizeVlsiQuery(rawQuery);
  const tokenSet = normalized.canonicalTokens;

  const matches: IntentMatch[] = [];

  for (const def of INTENT_DEFINITIONS) {
    // Check if query satisfies the gating "mustIncludeAny" constraint if specified
    if (def.mustIncludeAny && def.mustIncludeAny.length > 0) {
      const hasAny = def.mustIncludeAny.some((req) => tokenSet.has(req));
      if (!hasAny) continue;
    }

    let score = 0;
    let maxPossible = 0;

    for (const { term, weight } of def.keyTerms) {
      maxPossible += weight;
      if (tokenSet.has(term)) {
        score += weight;
      }
    }

    // Specificity Boost: Specific structural checks beat general overview
    if (def.id === "CHECK_DESIGN_UNRESOLVED" && tokenSet.has("unresolved")) {
      score += 4.0;
    } else if (def.id === "CHECK_DESIGN_MULTIPLE_DRIVER" && (tokenSet.has("multiple_driver") || tokenSet.has("contention"))) {
      score += 4.0;
    } else if (def.id === "CHECK_DESIGN_COMBO_LOOPS" && (tokenSet.has("loop") || tokenSet.has("combinational"))) {
      score += 4.0;
    } else if (def.id === "CHECK_DESIGN_ASSIGNS" && (tokenSet.has("assigns") || tokenSet.has("assign"))) {
      score += 4.0;
    } else if (def.id === "CHECK_DESIGN_TIEOFFS" && (tokenSet.has("tieoff") || tokenSet.has("tieoffs") || tokenSet.has("tiehi") || tokenSet.has("tielo"))) {
      score += 4.0;
    }

    if (score > 0 && maxPossible > 0) {
      const normalizedScore = score / maxPossible;
      matches.push({
        intentId: def.id,
        score: normalizedScore,
        label: def.label,
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  return {
    normalized,
    topIntent: matches.length > 0 && matches[0].score >= 0.20 ? matches[0] : null,
    allMatches: matches,
  };
}
