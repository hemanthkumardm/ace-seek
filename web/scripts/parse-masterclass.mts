import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ParsedSnippet {
  lang: "tcl" | "verilog" | "sdc" | "systemverilog" | "c" | "math";
  code: string;
}

interface ParsedQuestion {
  id: string;
  company?: string;
  companyName?: string;
  domain: string;
  domainName: string;
  role: string;
  difficulty: "Medium" | "Hard" | "Staff / Principal";
  round: "Technical Phone Screen" | "Onsite Technical Round 1" | "Onsite Deep-Dive" | "Hiring Manager Round";
  question: string;
  shortSummary: string;
  detailedAnswer: string;
  tclOrVerilogSnippet?: ParsedSnippet;
  commonPitfalls: string[];
  interviewerFollowups: string[];
  tags: string[];
  isFreeSample?: boolean;
}

const DOMAIN_MAP: Record<string, { domain: string; domainName: string; role: string }> = {
  "aptitude-quantitative": {
    domain: "aptitude-quantitative",
    domainName: "Quantitative Aptitude & Engineering Math",
    role: "Hardware Engineering Candidate",
  },
  "clock-domain-crossing": {
    domain: "clock-domain-crossing",
    domainName: "Clock Domain Crossing & Metastability",
    role: "CDC & SoC Integration Engineer",
  },
  "design-verification": {
    domain: "design-verification",
    domainName: "Design Verification (DV / UVM & SVA)",
    role: "Staff Design Verification / UVM Engineer",
  },
  "dft-atpg": {
    domain: "dft-atpg",
    domainName: "DFT, Scan Chains & Testability",
    role: "DFT & Testability Design Engineer",
  },
  "logical-reasoning-puzzles": {
    domain: "logical-reasoning-puzzles",
    domainName: "Logical Reasoning & Hardware Puzzles",
    role: "Hardware Logic & Architecture Candidate",
  },
  "low-power-upf": {
    domain: "low-power-upf",
    domainName: "Low Power UPF & Multi-Voltage",
    role: "Low-Power Methodology & UPF Architect",
  },
  "physical-design": {
    domain: "physical-design",
    domainName: "Physical Design (Floorplan, CTS, PnR)",
    role: "Physical Design & PnR Signoff Engineer",
  },
  "power-integrity-ir": {
    domain: "power-integrity-ir",
    domainName: "Power Integrity & Dynamic IR Drop",
    role: "Power Integrity & Grid Signoff Engineer",
  },
  "rtl-verilog-architecture": {
    domain: "rtl-verilog-architecture",
    domainName: "Verilog & Digital Architecture",
    role: "Digital RTL & Microarchitecture Engineer",
  },
  "static-timing-analysis": {
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "STA Timing Closure & Signoff Engineer",
  },
  "synthesis-sdc": {
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC Constraints",
    role: "Synthesis & Timing Constraints Engineer",
  },
};

function normalizeCompany(raw?: string): { company?: string; companyName?: string } {
  if (!raw) return {};
  const lower = raw.toLowerCase();
  if (lower.includes("nvidia")) return { company: "nvidia", companyName: "Nvidia" };
  if (lower.includes("qualcomm")) return { company: "qualcomm", companyName: "Qualcomm" };
  if (lower.includes("intel")) return { company: "intel", companyName: "Intel" };
  if (lower.includes("apple")) return { company: "apple", companyName: "Apple Silicon" };
  if (lower.includes("amd")) return { company: "amd", companyName: "AMD" };
  if (lower.includes("texas") || lower.includes("ti")) return { company: "texas-instruments", companyName: "Texas Instruments" };
  if (lower.includes("broadcom")) return { company: "broadcom", companyName: "Broadcom" };
  if (lower.includes("arm")) return { company: "arm", companyName: "Arm" };
  if (lower.includes("synopsys")) return { company: "synopsys", companyName: "Synopsys" };
  if (lower.includes("cadence")) return { company: "cadence", companyName: "Cadence" };
  if (lower.includes("google")) return { company: "google-silicon", companyName: "Google Silicon" };
  if (lower.includes("mediatek")) return { company: "mediatek", companyName: "MediaTek" };
  return { companyName: raw };
}

function normalizeDifficulty(raw?: string): "Medium" | "Hard" | "Staff / Principal" {
  if (!raw) return "Hard";
  const lower = raw.toLowerCase();
  if (lower.includes("staff") || lower.includes("principal")) return "Staff / Principal";
  if (lower.includes("medium")) return "Medium";
  return "Hard";
}

function normalizeRound(raw?: string): "Technical Phone Screen" | "Onsite Technical Round 1" | "Onsite Deep-Dive" | "Hiring Manager Round" {
  if (!raw) return "Onsite Technical Round 1";
  const lower = raw.toLowerCase();
  if (lower.includes("phone") || lower.includes("screen")) return "Technical Phone Screen";
  if (lower.includes("deep") || lower.includes("deep-dive")) return "Onsite Deep-Dive";
  if (lower.includes("manager") || lower.includes("hiring")) return "Hiring Manager Round";
  return "Onsite Technical Round 1";
}

function normalizeSnippetLang(raw?: string): "tcl" | "verilog" | "sdc" | "systemverilog" | "c" | "math" {
  if (!raw) return "tcl";
  const lower = raw.toLowerCase().trim();
  if (lower === "systemverilog" || lower === "sv") return "systemverilog";
  if (lower === "verilog" || lower === "v") return "verilog";
  if (lower === "sdc") return "sdc";
  if (lower === "c" || lower === "cpp") return "c";
  if (lower === "math" || lower === "latex") return "math";
  return "tcl";
}

export function parseMarkdownFile(filePath: string): ParsedQuestion[] {
  const content = fs.readFileSync(filePath, "utf8");
  const fileName = path.basename(filePath, ".md");
  const domainMeta = DOMAIN_MAP[fileName] || {
    domain: fileName,
    domainName: fileName,
    role: "VLSI Hardware Engineer",
  };

  const sections = content.split(/\n(?=### Q\d+[\.:\s])/g);
  const questions: ParsedQuestion[] = [];

  for (let i = 1; i < sections.length; i++) {
    const sec = sections[i];

    // 1. Title
    const titleMatch = sec.match(/^### Q\d+[\.:\s]+([^\n]+)/m);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // 2. Metadata fields
    const idMatch = sec.match(/- \*\*Suggested id:\*\*\s*`?([a-zA-Z0-9_-]+)`?/i);
    const id = idMatch ? idMatch[1].trim() : "";

    const diffMatch = sec.match(/- \*\*Difficulty:\*\*\s*([^\n]+)/i);
    const difficulty = normalizeDifficulty(diffMatch ? diffMatch[1] : undefined);

    const compMatch = sec.match(/- \*\*Company style:\*\*\s*([^\n]+)/i);
    const companyStyle = compMatch ? compMatch[1].trim() : undefined;
    const { company, companyName } = normalizeCompany(companyStyle);

    const roundMatch = sec.match(/- \*\*Round:\*\*\s*([^\n]+)/i);
    const round = normalizeRound(roundMatch ? roundMatch[1] : undefined);

    // 3. Question text
    const qMatch = sec.match(/- \*\*Question:\*\*\s*\n([\s\S]*?)(?=\n- \*\*Short answer:\*\*)/i);
    let questionText = qMatch ? qMatch[1].trim() : "";
    if (!questionText) {
      // Inline single line question
      const inlineQ = sec.match(/- \*\*Question:\*\*\s*([^\n]+)/i);
      questionText = inlineQ ? inlineQ[1].trim() : title;
    }

    // 4. Short answer
    const shortMatch = sec.match(/- \*\*Short answer:\*\*\s*\n?([\s\S]*?)(?=\n- \*\*Detailed answer:\*\*)/i);
    const shortSummary = shortMatch ? shortMatch[1].trim() : "";

    // 5. Detailed answer (goes up to Snippet, Common pitfalls, or next section)
    const detailedMatch = sec.match(/- \*\*Detailed answer:\*\*\s*\n?([\s\S]*?)(?=\n- \*\*(?:Snippet|Common pitfalls|Interviewer follow-ups|Tags):\*\*)/i);
    const detailedAnswer = detailedMatch ? detailedMatch[1].trim() : "";

    // 6. Snippet (optional)
    let snippet: ParsedSnippet | undefined;
    const snippetMatch = sec.match(/- \*\*Snippet:\*\*\s*\n?```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/i);
    if (snippetMatch) {
      snippet = {
        lang: normalizeSnippetLang(snippetMatch[1]),
        code: snippetMatch[2].trim(),
      };
    }

    // 7. Common pitfalls
    const pitfallsMatch = sec.match(/- \*\*Common pitfalls:\*\*\s*\n([\s\S]*?)(?=\n- \*\*(?:Interviewer follow-ups|Tags):\*\*)/i);
    const commonPitfalls: string[] = [];
    if (pitfallsMatch) {
      const lines = pitfallsMatch[1].split("\n");
      for (const line of lines) {
        const item = line.trim().replace(/^[-*]\s*/, "").trim();
        if (item) commonPitfalls.push(item);
      }
    }

    // 8. Interviewer follow-ups
    const followupsMatch = sec.match(/- \*\*Interviewer follow-ups:\*\*\s*\n([\s\S]*?)(?=\n- \*\*Tags:\*\*|\n---|$)/i);
    const interviewerFollowups: string[] = [];
    if (followupsMatch) {
      const lines = followupsMatch[1].split("\n");
      for (const line of lines) {
        const item = line.trim().replace(/^[-*]\s*/, "").trim();
        if (item) interviewerFollowups.push(item);
      }
    }

    // 9. Tags
    const tagsMatch = sec.match(/- \*\*Tags:\*\*\s*([^\n]+)/i);
    const tags = tagsMatch
      ? tagsMatch[1]
          .split(/[,;]/)
          .map((t) => t.trim().toLowerCase().replace(/[`]/g, ""))
          .filter(Boolean)
      : [domainMeta.domain];

    if (!id) {
      console.warn(`[WARN] Missing id in ${fileName} section ${i} (${title})`);
      continue;
    }

    const isFreeSample =
      ["dv-01", "dv-02", "apt-01", "apt-02", "puz-01", "puz-02", "rtl-01", "rtl-02", "ir-01", "ir-02"].includes(id);

    questions.push({
      id,
      ...(company ? { company: company as any } : {}),
      ...(companyName ? { companyName } : {}),
      domain: domainMeta.domain as any,
      domainName: domainMeta.domainName,
      role: domainMeta.role,
      difficulty,
      round,
      question: questionText || title,
      shortSummary,
      detailedAnswer,
      ...(snippet ? { tclOrVerilogSnippet: snippet } : {}),
      commonPitfalls: commonPitfalls.length > 0 ? commonPitfalls : ["Overlooking corner-case operating conditions."],
      interviewerFollowups: interviewerFollowups.length > 0 ? interviewerFollowups : ["How would you verify this on real silicon?"],
      tags,
      ...(isFreeSample ? { isFreeSample: true } : {}),
    });
  }

  return questions;
}

// Generate additions file
const docsDir = path.resolve(__dirname, "../../docs/interview-masterclass");
const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md") && f !== "README.md" && !f.startsWith("00-"));
console.log(`Parsing ${files.length} files...`);

const allNewQuestions: ParsedQuestion[] = [];
for (const f of files) {
  const qs = parseMarkdownFile(path.join(docsDir, f));
  console.log(`✓ ${f}: parsed ${qs.length} questions`);
  allNewQuestions.push(...qs);
}
console.log(`\n🎉 Total parsed questions: ${allNewQuestions.length}`);

// Write web/src/lib/vlsi-interview-masterclass-additions.ts
const targetFile = path.resolve(__dirname, "../src/lib/vlsi-interview-masterclass-additions.ts");
const fileContent = `/**
 * VLSI Interview Masterclass — Additional Question Banks
 * Auto-generated from docs/interview-masterclass markdown packs.
 * Total additional questions: ${allNewQuestions.length}
 */

import type { InterviewQuestion } from "./vlsi-interview-masterclass-data";

export const ADDITIONAL_INTERVIEW_QUESTIONS: InterviewQuestion[] = ${JSON.stringify(allNewQuestions, null, 2)};
`;

fs.writeFileSync(targetFile, fileContent, "utf8");
console.log(`\n✅ Generated ${targetFile} (${(Buffer.byteLength(fileContent) / 1024).toFixed(1)} KB)`);

