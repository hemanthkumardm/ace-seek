export type TheoryNode =
  | { t: "h"; level: 1 | 2 | 3 | 4; text: string }
  | { t: "divider" }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "table"; kind: "plain" | "compare"; caption?: string; headers: string[]; rows: string[][] }
  | { t: "qa"; q: string; a: string }
  | { t: "callout"; tone: "note" | "warn" | "tip" | "example"; text: string }
  | { t: "flow"; steps: string[] }
  | { t: "code"; lang: string; code: string; title?: string }
  | { t: "try"; lang: string; code: string }
  | { t: "card"; title: string; text: string };

function splitRow(line: string): string[] {
  return line
    .split("|")
    .map((c) => c.trim())
    .filter((c, i, a) => !(c === "" && (i === 0 || i === a.length - 1)));
}

function isBullet(line: string) {
  return /^\s*[-•*]\s+/.test(line) && !/^\s*[-*]{3,}\s*$/.test(line);
}
function isNumbered(line: string) {
  return /^\s*\d+[.)]\s+/.test(line);
}
function isMarkdownDivider(line: string) {
  return /^\s*[-*_]{3,}\s*$/.test(line);
}
function isMarkdownTableRow(line: string) {
  return line.startsWith("|") && line.endsWith("|");
}

/**
 * Parse Learn theory `body[]` into rich textbook blocks.
 * Supports headings (#, ##, ###, ####), markdown fences (```), legacy CODE/ENDCODE,
 * lists, tables, compare charts, Q&A, callouts, flow, TRY labs, and horizontal rules.
 */
export function parseTheoryArticle(paragraphs: string[]): TheoryNode[] {
  const src = paragraphs.join("\n\n").replace(/\r\n/g, "\n");
  const lines = src.split("\n");
  const out: TheoryNode[] = [];
  let i = 0;

  const flushP = (buf: string[]) => {
    const text = buf.join(" ").trim();
    if (!text) return;
    // Match definitions like "Term Name: Description"
    const m = text.match(/^([A-Za-z0-9\s()_\-/.]{2,45}):\s+([\s\S]+)$/);
    if (
      m &&
      !/^(https?|Q|A|NOTE|WARN|WARNING|TIP|EXAMPLE|FLOW|STEP|STAGE|FIGURE)/i.test(m[1].trim()) &&
      !m[1].includes("\n")
    ) {
      out.push({ t: "card", title: m[1].trim(), text: m[2].trim() });
    } else {
      out.push({ t: "p", text });
    }
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      i++;
      continue;
    }

    // 1. Horizontal dividers (---, ***, ___)
    if (isMarkdownDivider(line)) {
      out.push({ t: "divider" });
      i++;
      continue;
    }

    // 2. Markdown Headings (#, ##, ###, ####)
    const hMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (hMatch) {
      const level = hMatch[1].length as 1 | 2 | 3 | 4;
      out.push({ t: "h", level, text: hMatch[2].trim() });
      i++;
      continue;
    }

    // 3. Markdown Code Fences (```lang ... ```)
    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, "").trim() || "text";
      i++;
      const buf: string[] = [];
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // consume closing ```
      out.push({ t: "code", lang, code: buf.join("\n").replace(/^\n/, "").replace(/\n$/, "") });
      continue;
    }

    // 4. Legacy CODE / EXAMPLE blocks
    if (/^(CODE|EXAMPLE)\b/i.test(line)) {
      const parts = line.split(/\s+/);
      const lang = (parts[1] || "text").toLowerCase();
      i++;
      const buf: string[] = [];
      while (i < lines.length && !/^(ENDCODE|ENDEXAMPLE)\b/i.test(lines[i].trim())) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      out.push({ t: "code", lang, code: buf.join("\n").replace(/^\n/, "").replace(/\n$/, "") });
      continue;
    }

    // 5. Standard Markdown Tables & Custom TABLE/COMPARE
    if (/^(TABLE|COMPARE)\b/i.test(line)) {
      const kind = line.toUpperCase().startsWith("COMPARE") ? "compare" : "plain";
      const caption = line.replace(/^(TABLE|COMPARE)\s*/i, "").trim() || undefined;
      i++;
      const rows: string[][] = [];
      while (i < lines.length && !/^(ENDTABLE|ENDCOMPARE)\b/i.test(lines[i].trim())) {
        const r = lines[i].trim();
        if (r && !/^---+$/.test(r)) rows.push(splitRow(r));
        i++;
      }
      if (i < lines.length) i++;
      if (rows.length >= 2) {
        out.push({ t: "table", kind, caption, headers: rows[0], rows: rows.slice(1) });
      }
      continue;
    }

    if (isMarkdownTableRow(line)) {
      const rows: string[][] = [];
      while (i < lines.length && isMarkdownTableRow(lines[i].trim())) {
        const r = lines[i].trim();
        // Skip separator row like |---|---|
        if (!/^\|(?:\s*:?-+:?\s*\|)+$/.test(r)) {
          rows.push(splitRow(r));
        }
        i++;
      }
      if (rows.length >= 2) {
        out.push({ t: "table", kind: "plain", headers: rows[0], rows: rows.slice(1) });
      } else if (rows.length === 1) {
        out.push({ t: "p", text: rows[0].join(" | ") });
      }
      continue;
    }

    // 6. Interactive TRY labs
    if (/^TRY\s+\w+/i.test(line)) {
      const lang = line.split(/\s+/)[1].toLowerCase();
      i++;
      const buf: string[] = [];
      while (i < lines.length && !/^ENDTRY\b/i.test(lines[i].trim())) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      out.push({ t: "try", lang, code: buf.join("\n").replace(/^\n/, "").replace(/\n$/, "") });
      continue;
    }

    // 7. Flow steps
    if (/^FLOW:/i.test(line)) {
      const steps = line
        .replace(/^FLOW:\s*/i, "")
        .split(/->|→/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (steps.length) out.push({ t: "flow", steps });
      i++;
      continue;
    }

    // 8. Q&A
    if (/^Q:\s*/i.test(line)) {
      const q = line.replace(/^Q:\s*/i, "");
      i++;
      let a = "";
      if (i < lines.length && /^A:\s*/i.test(lines[i].trim())) {
        a = lines[i].trim().replace(/^A:\s*/i, "");
        i++;
      }
      out.push({ t: "qa", q, a });
      continue;
    }

    // 9. Callout alerts
    const call = line.match(/^(NOTE|WARN|WARNING|TIP|EXAMPLE):\s*(.*)$/i);
    if (call) {
      const tag = call[1].toUpperCase();
      const tone =
        tag.startsWith("WARN") ? "warn" : tag === "TIP" ? "tip" : tag === "EXAMPLE" ? "example" : "note";
      out.push({ t: "callout", tone, text: call[2] });
      i++;
      continue;
    }

    // 10. Unordered lists
    if (isBullet(line)) {
      const items: string[] = [];
      while (i < lines.length && isBullet(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\s*[-•*]\s+/, ""));
        i++;
      }
      out.push({ t: "ul", items });
      continue;
    }

    // 11. Numbered lists
    if (isNumbered(line)) {
      const items: string[] = [];
      while (i < lines.length && isNumbered(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      out.push({ t: "ol", items });
      continue;
    }

    // 12. Standard Paragraph Buffer
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isMarkdownDivider(lines[i].trim()) &&
      !/^#{1,4}\s+/.test(lines[i].trim()) &&
      !/^```/.test(lines[i].trim()) &&
      !isMarkdownTableRow(lines[i].trim()) &&
      !/^(TABLE|COMPARE|CODE|EXAMPLE|TRY|ENDTABLE|ENDCOMPARE|ENDCODE|ENDEXAMPLE|ENDTRY|Q:|A:|NOTE:|WARN:|WARNING:|TIP:|FLOW:)/i.test(
        lines[i].trim()
      ) &&
      !isBullet(lines[i].trim()) &&
      !isNumbered(lines[i].trim())
    ) {
      buf.push(lines[i].trim());
      i++;
    }
    flushP(buf);
  }

  return out;
}
