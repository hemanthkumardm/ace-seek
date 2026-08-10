/**
 * Max-quality text/code diff helpers (Myers algorithm via `diff` package).
 */
import {
  diffLines,
  diffWords,
  diffChars,
  createTwoFilesPatch,
  type Change,
} from "diff";

export type DiffViewMode = "split" | "unified";
export type DiffGranularity = "line" | "word" | "char";

export type DiffOptions = {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  ignoreEmptyLines?: boolean;
  ignoreComments?: boolean;
  trimLines?: boolean;
  contextLines: number; // for patch export / collapse
};

export type AlignedRow =
  | {
      kind: "equal";
      leftLine: number;
      rightLine: number;
      leftText: string;
      rightText: string;
    }
  | {
      kind: "modify";
      leftLine: number;
      rightLine: number;
      leftText: string;
      rightText: string;
      /** HTML-safe segments for char/word highlight inside line */
      leftParts: DiffPart[];
      rightParts: DiffPart[];
    }
  | {
      kind: "add";
      rightLine: number;
      rightText: string;
    }
  | {
      kind: "del";
      leftLine: number;
      leftText: string;
    }
  | {
      kind: "skip";
      count: number;
    };

export type DiffPart = { value: string; type: "same" | "add" | "del" };

export type DiffStats = {
  additions: number;
  deletions: number;
  modifications: number;
  unchanged: number;
  totalLeft: number;
  totalRight: number;
  changeBlocks: number;
};

function normalize(text: string, opts: DiffOptions): string {
  let lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (opts.ignoreComments) {
    lines = lines.map((line) => line.replace(/\/\/.*$|#.*$/g, ""));
  }
  if (opts.ignoreEmptyLines) {
    lines = lines.filter((line) => line.trim().length > 0);
  }
  if (opts.trimLines) {
    lines = lines.map((line) => line.trim());
  }
  let t = lines.join("\n");
  if (opts.ignoreCase) t = t.toLowerCase();
  return t;
}

function lineNormalize(line: string, opts: DiffOptions): string {
  let l = line;
  if (opts.ignoreComments) l = l.replace(/\/\/.*$|#.*$/g, "");
  if (opts.trimLines) l = l.trim();
  if (opts.ignoreWhitespace) l = l.replace(/[ \t]+/g, " ").trimEnd();
  if (opts.ignoreCase) l = l.toLowerCase();
  return l;
}

/** Build aligned side-by-side rows using line-level Myers diff */
export function buildAlignedDiff(
  left: string,
  right: string,
  opts: DiffOptions,
  granularity: DiffGranularity = "word"
): { rows: AlignedRow[]; stats: DiffStats } {
  const leftN = normalize(left, opts);
  const rightN = normalize(right, opts);

  const changes = diffLines(leftN, rightN, {
    ignoreWhitespace: opts.ignoreWhitespace,
  });

  const rows: AlignedRow[] = [];
  let leftLine = 1;
  let rightLine = 1;
  let additions = 0;
  let deletions = 0;
  let modifications = 0;
  let unchanged = 0;
  let changeBlocks = 0;

  // Pair consecutive del+add as modify
  let i = 0;
  while (i < changes.length) {
    const cur = changes[i];
    const next = changes[i + 1];

    if (cur.removed && next?.added) {
      changeBlocks++;
      const delLines = splitLines(cur.value);
      const addLines = splitLines(next.value);
      const max = Math.max(delLines.length, addLines.length);
      for (let k = 0; k < max; k++) {
        const l = delLines[k];
        const r = addLines[k];
        if (l !== undefined && r !== undefined) {
          if (lineNormalize(l, opts) === lineNormalize(r, opts)) {
            rows.push({
              kind: "equal",
              leftLine: leftLine++,
              rightLine: rightLine++,
              leftText: l,
              rightText: r,
            });
            unchanged++;
          } else {
            const parts = inlineParts(l, r, granularity, opts);
            rows.push({
              kind: "modify",
              leftLine: leftLine++,
              rightLine: rightLine++,
              leftText: l,
              rightText: r,
              leftParts: parts.left,
              rightParts: parts.right,
            });
            modifications++;
          }
        } else if (l !== undefined) {
          rows.push({ kind: "del", leftLine: leftLine++, leftText: l });
          deletions++;
        } else if (r !== undefined) {
          rows.push({ kind: "add", rightLine: rightLine++, rightText: r });
          additions++;
        }
      }
      i += 2;
      continue;
    }

    if (cur.added) {
      changeBlocks++;
      for (const line of splitLines(cur.value)) {
        rows.push({ kind: "add", rightLine: rightLine++, rightText: line });
        additions++;
      }
      i++;
      continue;
    }

    if (cur.removed) {
      changeBlocks++;
      for (const line of splitLines(cur.value)) {
        rows.push({ kind: "del", leftLine: leftLine++, leftText: line });
        deletions++;
      }
      i++;
      continue;
    }

    // equal
    for (const line of splitLines(cur.value)) {
      rows.push({
        kind: "equal",
        leftLine: leftLine++,
        rightLine: rightLine++,
        leftText: line,
        rightText: line,
      });
      unchanged++;
    }
    i++;
  }

  const stats: DiffStats = {
    additions,
    deletions,
    modifications,
    unchanged,
    totalLeft: leftN === "" ? 0 : leftN.split("\n").length,
    totalRight: rightN === "" ? 0 : rightN.split("\n").length,
    changeBlocks,
  };

  return { rows, stats };
}

/** Collapse long equal stretches for readability */
export function collapseUnchanged(
  rows: AlignedRow[],
  context: number
): AlignedRow[] {
  if (context < 0) return rows;
  const out: AlignedRow[] = [];
  let i = 0;
  while (i < rows.length) {
    if (rows[i].kind !== "equal") {
      out.push(rows[i]);
      i++;
      continue;
    }
    let j = i;
    while (j < rows.length && rows[j].kind === "equal") j++;
    const run = j - i;
    if (run <= context * 2 + 1) {
      for (let k = i; k < j; k++) out.push(rows[k]);
    } else {
      for (let k = i; k < i + context; k++) out.push(rows[k]);
      out.push({ kind: "skip", count: run - context * 2 });
      for (let k = j - context; k < j; k++) out.push(rows[k]);
    }
    i = j;
  }
  return out;
}

export function buildUnifiedHunks(
  left: string,
  right: string,
  opts: DiffOptions
): Change[] {
  return diffLines(normalize(left, opts), normalize(right, opts), {
    ignoreWhitespace: opts.ignoreWhitespace,
  });
}

export function exportUnifiedPatch(
  leftName: string,
  rightName: string,
  left: string,
  right: string,
  context = 3
): string {
  return createTwoFilesPatch(
    leftName || "a.txt",
    rightName || "b.txt",
    left.replace(/\r\n/g, "\n"),
    right.replace(/\r\n/g, "\n"),
    undefined,
    undefined,
    { context }
  );
}

function splitLines(block: string): string[] {
  if (block === "") return [];
  // diff package keeps trailing newline on chunks
  const parts = block.replace(/\n$/, "").split("\n");
  return parts;
}

function inlineParts(
  left: string,
  right: string,
  granularity: DiffGranularity,
  opts: DiffOptions
): { left: DiffPart[]; right: DiffPart[] } {
  if (granularity === "line") {
    return {
      left: [{ value: left, type: "del" }],
      right: [{ value: right, type: "add" }],
    };
  }

  const a = opts.ignoreCase ? left.toLowerCase() : left;
  const b = opts.ignoreCase ? right.toLowerCase() : right;
  const changes =
    granularity === "char"
      ? diffChars(a, b)
      : diffWords(a, b);

  // Map back to original casing by walking original strings
  const leftParts: DiffPart[] = [];
  const rightParts: DiffPart[] = [];
  let li = 0;
  let ri = 0;

  for (const c of changes) {
    const len = c.value.length;
    if (c.added) {
      rightParts.push({ value: right.slice(ri, ri + len), type: "add" });
      ri += len;
    } else if (c.removed) {
      leftParts.push({ value: left.slice(li, li + len), type: "del" });
      li += len;
    } else {
      leftParts.push({ value: left.slice(li, li + len), type: "same" });
      rightParts.push({ value: right.slice(ri, ri + len), type: "same" });
      li += len;
      ri += len;
    }
  }
  return { left: leftParts, right: rightParts };
}

export function findNextChangeIndex(rows: AlignedRow[], from: number): number {
  for (let i = from + 1; i < rows.length; i++) {
    const k = rows[i].kind;
    if (k === "add" || k === "del" || k === "modify") return i;
  }
  for (let i = 0; i <= from; i++) {
    const k = rows[i].kind;
    if (k === "add" || k === "del" || k === "modify") return i;
  }
  return -1;
}

export function findPrevChangeIndex(rows: AlignedRow[], from: number): number {
  for (let i = from - 1; i >= 0; i--) {
    const k = rows[i].kind;
    if (k === "add" || k === "del" || k === "modify") return i;
  }
  for (let i = rows.length - 1; i >= from; i--) {
    const k = rows[i].kind;
    if (k === "add" || k === "del" || k === "modify") return i;
  }
  return -1;
}
