import type { PracticalCheck, PracticalLanguage } from "@/lib/vlsi-curriculum";

export type CheckResult = {
  id: string;
  label: string;
  ok: boolean;
};

function stripComments(source: string, language: PracticalLanguage): string {
  let s = source;
  if (language === "verilog") {
    s = s.replace(/\/\*[\s\S]*?\*\//g, " ");
    s = s.replace(/\/\/.*$/gm, " ");
  } else if (language === "vim") {
    s = s.replace(/^\s*".*$/gm, " ");
  } else if (language === "python") {
    s = s.replace(/"""[\s\S]*?"""/g, " ");
    s = s.replace(/#.*$/gm, " ");
  } else if (language === "xml") {
    s = s.replace(/<!--[\s\S]*?-->/g, " ");
  } else {
    // keep #! shebangs; strip other # comments
    s = s.replace(/^[ \t]*#[^!].*$/gm, " ");
    s = s.replace(/([^\n])#[^!].*$/gm, "$1");
  }
  return s;
}

export function runPracticalChecks(
  source: string,
  checks: PracticalCheck[],
  language: PracticalLanguage
): CheckResult[] {
  const stripped = stripComments(source, language);
  const lower = stripped.toLowerCase();

  return checks.map((c) => {
    let ok = false;
    if (c.kind === "includes") {
      ok = lower.includes(c.pattern.toLowerCase());
    } else if (c.kind === "excludes") {
      ok = !lower.includes(c.pattern.toLowerCase());
    } else {
      ok = new RegExp(c.pattern, c.flags || "im").test(stripped);
    }
    return { id: c.id, label: c.label, ok };
  });
}
