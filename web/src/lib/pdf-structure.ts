/**
 * Intelligent PDF Structure & Markdown Reconstruct Engine
 * Converts raw pdftotext dumps into publication-quality structured Markdown:
 * - Reconstructs document title & metadata grids
 * - Cleans headers, footers, page-breaks (\x0c) & confidential notices
 * - Formats sections (## 1. Title) and sub-sections (### Issue #1)
 * - Detects column alignments and rebuilds clean Markdown tables
 * - Detects and fences code blocks (RON, Rust, C, Tcl, Verilog, CLI)
 * - Normalizes bullet points and callouts
 */

export function smartPdfToMarkdown(rawText: string, originalFilename?: string): string {
  if (!rawText || !rawText.trim()) {
    return `# Document\n\n*(No text content extracted from PDF)*\n`;
  }

  // 1. Strip form-feed page delimiters and normalize linebreaks
  let text = rawText
    .replace(/\f/g, "\n\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // 2. Remove repeating header/footer artifacts
  // e.g. "LogicLance Work Log | Confidential   Page 1 of 3"
  text = text.replace(
    /^[ \t]*[A-Za-z0-9_\-\. ]+(?:Work Log|Report|Confidential|Internal Documentation)[ \t]*\|[^\n]*$/gim,
    ""
  );
  text = text.replace(/^[ \t]*Page \d+ of \d+[ \t]*$/gim, "");

  const rawLines = text.split("\n");
  const processedLines: string[] = [];
  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];
  let codeLanguage = "";

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (inCodeBlock) {
        codeBlockBuffer.push("");
      } else {
        processedLines.push("");
      }
      i++;
      continue;
    }

    // Detect start/end of Code / Config Blocks (e.g. RON, JSON, C, Rust)
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("(") ||
      trimmed.startsWith("{") ||
      trimmed.startsWith("signals: [") ||
      trimmed.startsWith("module ") ||
      trimmed.startsWith("always @")
    ) {
      if (!inCodeBlock && (trimmed.startsWith("//") || trimmed.startsWith("("))) {
        inCodeBlock = true;
        codeLanguage = trimmed.includes("RON") || trimmed.includes("Surfer") ? "ron" : "rust";
        codeBlockBuffer = [line];
        i++;
        continue;
      }
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      if (trimmed === ")" || trimmed === "}" || trimmed === ");") {
        inCodeBlock = false;
        processedLines.push("```" + (codeLanguage || ""));
        processedLines.push(...codeBlockBuffer);
        processedLines.push("```");
        codeBlockBuffer = [];
      }
      i++;
      continue;
    }

    // Detect Key-Value Metadata Grid (e.g., Task Ref ID ... Date Executed ...)
    if (
      /^(Task Ref ID|Lead Engineer|Target System|Author|Date Executed|Status|Project|Version)\b/i.test(
        trimmed
      )
    ) {
      const pairs = parseMetadataLine(line);
      if (pairs.length >= 1) {
        const allPairs: [string, string][] = [...pairs];
        let nextIdx = i + 1;
        while (nextIdx < rawLines.length) {
          const nextTrimmed = rawLines[nextIdx].trim();
          if (
            nextTrimmed &&
            /^(Task Ref ID|Lead Engineer|Target System|Author|Date Executed|Status|Project|Version|Effort Duration|Priority)\b/i.test(
              nextTrimmed
            )
          ) {
            allPairs.push(...parseMetadataLine(rawLines[nextIdx]));
            nextIdx++;
          } else {
            break;
          }
        }

        if (allPairs.length >= 2) {
          processedLines.push("");
          processedLines.push("| Parameter | Specification | Parameter | Specification |");
          processedLines.push("| :--- | :--- | :--- | :--- |");
          for (let p = 0; p < allPairs.length; p += 2) {
            const p1 = allPairs[p] || ["", ""];
            const p2 = allPairs[p + 1] || ["", ""];
            processedLines.push(
              `| **${p1[0]}** | \`${p1[1]}\` | **${p2[0]}** | \`${p2[1]}\` |`
            );
          }
          processedLines.push("");
          i = nextIdx;
          continue;
        }
      }
    }

    // Detect Major Section Headings: "1. EXECUTIVE SUMMARY & CONTEXT" or "2. TECHNICAL..."
    const sectionMatch = trimmed.match(/^(\d+)\.\s+([A-Za-z0-9\s,&:\/\-\(\)\.]+)/);
    if (sectionMatch && sectionMatch[2].length > 3) {
      const num = sectionMatch[1];
      const title = toTitleCase(sectionMatch[2].trim());
      processedLines.push("");
      processedLines.push(`## ${num}. ${title}`);
      processedLines.push("");
      i++;
      continue;
    }

    // Detect Sub-issues: "Issue #1: Pipe Lock Deadlock..."
    if (/^Issue\s*#?\d+[:\-]/i.test(trimmed)) {
      processedLines.push("");
      processedLines.push(`### ${trimmed}`);
      processedLines.push("");
      i++;
      continue;
    }

    // Detect Figures: "FIGURE 1: MIGRATION ARCHITECTURE..."
    if (/^FIGURE\s*\d+[:\-]/i.test(trimmed)) {
      processedLines.push("");
      processedLines.push(`> 📊 **${trimmed}**`);
      processedLines.push("");
      i++;
      continue;
    }

    // Detect Table Headers with multiple column headers separated by wide spaces
    if (
      (trimmed.includes("Legacy Integration") ||
        trimmed.includes("Modern Integration") ||
        trimmed.includes("Time Window") ||
        trimmed.includes("Challenge Description") ||
        trimmed.includes("Evaluation Domain")) &&
      line.includes("   ")
    ) {
      // Table detected! Parse table rows until empty line
      const tableRows: string[] = [line];
      let tIdx = i + 1;
      while (tIdx < rawLines.length && rawLines[tIdx].trim()) {
        tableRows.push(rawLines[tIdx]);
        tIdx++;
      }

      const mdTable = convertSpaceColumnsToMarkdownTable(tableRows);
      if (mdTable) {
        processedLines.push("");
        processedLines.push(mdTable);
        processedLines.push("");
        i = tIdx;
        continue;
      }
    }

    // Convert bullet characters • to clean Markdown list items
    if (trimmed.startsWith("•") || trimmed.startsWith("·")) {
      processedLines.push("- " + trimmed.slice(1).trim());
      i++;
      continue;
    }

    // Bold root cause and fix labels
    let formattedLine = line;
    formattedLine = formattedLine.replace(/Root Cause:/gi, "**Root Cause:**");
    formattedLine = formattedLine.replace(/Fix Implemented:/gi, "**Fix Implemented:**");
    formattedLine = formattedLine.replace(/Report Prepared By:/gi, "**Report Prepared By:**");
    formattedLine = formattedLine.replace(/Approved By:/gi, "**Approved By:**");

    // Format top title banner if it's the very first non-empty lines
    if (
      processedLines.filter(Boolean).length === 0 &&
      (trimmed.includes("PLATFORM") || trimmed.includes("LOG") || trimmed.includes("Migration:"))
    ) {
      if (trimmed.includes(":") || trimmed === trimmed.toUpperCase()) {
        processedLines.push(`# ${trimmed}`);
        i++;
        continue;
      }
    }

    processedLines.push(formattedLine);
    i++;
  }

  if (inCodeBlock && codeBlockBuffer.length > 0) {
    processedLines.push("```" + (codeLanguage || ""));
    processedLines.push(...codeBlockBuffer);
    processedLines.push("```");
  }

  // Join and clean double blank lines
  let result = processedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // If the document doesn't start with an H1, add a clean title from filename or header
  if (!result.startsWith("# ")) {
    const docTitle = originalFilename
      ? originalFilename.replace(/\.[^/.]+$/, "").replace(/[_\-]+/g, " ")
      : "Document";
    result = `# ${toTitleCase(docTitle)}\n\n${result}`;
  }

  return result + "\n";
}

function parseMetadataLine(line: string): [string, string][] {
  const recognizedKeys = [
    "Task Ref ID",
    "Date Executed",
    "Lead Engineer",
    "Effort Duration",
    "Target System",
    "Status",
    "Author",
    "Date",
    "Project",
    "Version",
    "Priority",
  ];

  // Sort keys by descending length to prevent prefix collisions (e.g. "Date" vs "Date Executed")
  recognizedKeys.sort((a, b) => b.length - a.length);

  const found: { key: string; index: number }[] = [];
  for (const k of recognizedKeys) {
    const idx = line.indexOf(k);
    if (idx !== -1) {
      // Ensure this occurrence is not overlapping an already found longer key
      const overlaps = found.some(
        (f) => idx >= f.index && idx < f.index + f.key.length
      );
      if (!overlaps) {
        found.push({ key: k, index: idx });
      }
    }
  }
  found.sort((a, b) => a.index - b.index);

  if (found.length === 0) return [];

  const pairs: [string, string][] = [];
  for (let i = 0; i < found.length; i++) {
    const current = found[i];
    const next = found[i + 1];
    const rawVal = next
      ? line.substring(current.index + current.key.length, next.index)
      : line.substring(current.index + current.key.length);
    pairs.push([current.key, rawVal.trim()]);
  }
  return pairs;
}

function convertSpaceColumnsToMarkdownTable(lines: string[]): string | null {
  if (!lines || lines.length === 0) return null;
  const headerLine = lines[0];

  const headers = headerLine
    .split(/\s{3,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (headers.length < 2) return null;

  const out: string[] = [];
  out.push("| " + headers.join(" | ") + " |");
  out.push("| " + headers.map(() => ":---").join(" | ") + " |");

  for (let r = 1; r < lines.length; r++) {
    const row = lines[r].trim();
    if (!row) continue;

    const cols = row
      .split(/\s{3,}/)
      .map((s) => s.trim())
      .filter(Boolean);

    const padded: string[] = [];
    for (let c = 0; c < headers.length; c++) {
      padded.push(cols[c] || "");
    }
    out.push("| " + padded.join(" | ") + " |");
  }

  return out.join("\n");
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
