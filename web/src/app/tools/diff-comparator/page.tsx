"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  GitCompare,
  Upload,
  Copy,
  Check,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Download,
  Pencil,
  X,
  Columns2,
  AlignJustify,
  CheckCircle2,
} from "lucide-react";
import {
  AlignedRow,
  DiffGranularity,
  DiffViewMode,
  buildAlignedDiff,
  collapseUnchanged,
  exportUnifiedPatch,
  findNextChangeIndex,
  findPrevChangeIndex,
} from "@/lib/diff-engine";

const SAMPLE_A = `# Release notes

Version: 1.0.0
Status: Draft

- Core compiler
- Basic PDF export
`;

const SAMPLE_B = `# Release notes

Version: 1.1.0
Status: Production

- Core compiler engine
- High resolution PDF
- Visual diff comparator
`;

function InlineParts({
  parts,
}: {
  parts: { value: string; type: "same" | "add" | "del" }[];
}) {
  return (
    <>
      {parts.map((p, i) => (
        <span
          key={i}
          className={
            p.type === "add"
              ? "rounded bg-emerald-200/90 text-emerald-950 px-0.5"
              : p.type === "del"
                ? "rounded bg-rose-200/90 text-rose-950 px-0.5 line-through decoration-rose-400/70"
                : undefined
          }
        >
          {p.value || "\u00a0"}
        </span>
      ))}
    </>
  );
}

export default function DiffComparatorPage() {
  const [textA, setTextA] = useState(SAMPLE_A);
  const [textB, setTextB] = useState(SAMPLE_B);
  const [nameA, setNameA] = useState("original.txt");
  const [nameB, setNameB] = useState("modified.txt");
  const [viewMode, setViewMode] = useState<DiffViewMode>("split");
  const [granularity, setGranularity] = useState<DiffGranularity>("word");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreEmptyLines, setIgnoreEmptyLines] = useState(false);
  const [ignoreComments, setIgnoreComments] = useState(false);
  const [trimLines, setTrimLines] = useState(false);
  const [collapseUnchangedLines, setCollapseUnchangedLines] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [toast, setToast] = useState("");

  const fileARef = useRef<HTMLInputElement>(null);
  const fileBRef = useRef<HTMLInputElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const opts = useMemo(
    () => ({
      ignoreWhitespace,
      ignoreCase,
      ignoreEmptyLines,
      ignoreComments,
      trimLines,
      contextLines: 3,
    }),
    [ignoreWhitespace, ignoreCase, ignoreEmptyLines, ignoreComments, trimLines]
  );

  const { rows: rawRows, stats } = useMemo(
    () => buildAlignedDiff(textA, textB, opts, granularity),
    [textA, textB, opts, granularity]
  );

  const rows = useMemo(
    () => (collapseUnchangedLines ? collapseUnchanged(rawRows, 3) : rawRows),
    [rawRows, collapseUnchangedLines]
  );

  const swapTexts = () => {
    setTextA(textB);
    setTextB(textA);
    setNameA(nameB);
    setNameB(nameA);
    flash("Swapped left ↔ right");
  };

  const patch = useMemo(
    () => exportUnifiedPatch(nameA, nameB, textA, textB, 3),
    [nameA, nameB, textA, textB]
  );

  const hasChanges =
    stats.additions + stats.deletions + stats.modifications > 0;

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2000);
  };

  const loadFile = (side: "a" | "b", file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      if (side === "a") {
        setTextA(text);
        setNameA(file.name);
      } else {
        setTextB(text);
        setNameB(file.name);
      }
      flash(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  const onSyncScroll = useCallback(
    (source: "left" | "right") => {
      if (viewMode !== "split" || syncing.current) return;
      const from = source === "left" ? leftScrollRef.current : rightScrollRef.current;
      const to = source === "left" ? rightScrollRef.current : leftScrollRef.current;
      if (!from || !to) return;
      syncing.current = true;
      to.scrollTop = from.scrollTop;
      requestAnimationFrame(() => {
        syncing.current = false;
      });
    },
    [viewMode]
  );

  const jumpTo = (idx: number) => {
    if (idx < 0) return;
    setHighlightIdx(idx);
    rowRefs.current.get(idx)?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  useEffect(() => {
    setHighlightIdx(-1);
  }, [textA, textB, ignoreWhitespace]);

  // Escape closes drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const lineBg = (kind: string, hi: boolean) => {
    const ring = hi ? " ring-2 ring-sky-400 ring-inset" : "";
    if (kind === "equal") return `bg-white text-slate-700${ring}`;
    if (kind === "del") return `bg-rose-50 text-rose-950${ring}`;
    if (kind === "add") return `bg-emerald-50 text-emerald-950${ring}`;
    if (kind === "modify") return `bg-amber-50 text-amber-950${ring}`;
    return `bg-slate-50 text-slate-500${ring}`;
  };

  const renderSplit = (row: AlignedRow, idx: number, side: "left" | "right") => {
    const hi = highlightIdx === idx;
    const isLeft = side === "left";

    if (row.kind === "skip") {
      return (
        <div
          key={`${side}-s-${idx}`}
          className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-center text-xs text-slate-400"
        >
          {row.count} unchanged lines
        </div>
      );
    }

    if (row.kind === "equal") {
      const text = isLeft ? row.leftText : row.rightText;
      const ln = isLeft ? row.leftLine : row.rightLine;
      return (
        <div
          key={`${side}-${idx}`}
          ref={(el) => {
            if (el && isLeft) rowRefs.current.set(idx, el);
          }}
          className={`grid grid-cols-[2.75rem_1fr] border-b border-slate-100 text-[12px] leading-5 ${lineBg("equal", hi)}`}
        >
          <span className="select-none py-1.5 pr-2 text-right text-[11px] tabular-nums text-slate-300">
            {ln}
          </span>
          <span className="whitespace-pre-wrap break-all py-1.5 pr-3 font-mono">
            {text || "\u00a0"}
          </span>
        </div>
      );
    }

    if (row.kind === "del") {
      if (!isLeft)
        return (
          <div key={`${side}-${idx}`} className="min-h-[1.85rem] border-b border-slate-100 bg-slate-50/60" />
        );
      return (
        <div
          key={`${side}-${idx}`}
          ref={(el) => {
            if (el) rowRefs.current.set(idx, el);
          }}
          className={`grid grid-cols-[2.75rem_1fr] border-b border-rose-100 text-[12px] leading-5 ${lineBg("del", hi)}`}
        >
          <span className="select-none py-1.5 pr-2 text-right text-[11px] tabular-nums text-rose-300">
            {row.leftLine}
          </span>
          <span className="whitespace-pre-wrap break-all py-1.5 pr-3 font-mono">
            {row.leftText || "\u00a0"}
          </span>
        </div>
      );
    }

    if (row.kind === "add") {
      if (isLeft)
        return (
          <div key={`${side}-${idx}`} className="min-h-[1.85rem] border-b border-slate-100 bg-slate-50/60" />
        );
      return (
        <div
          key={`${side}-${idx}`}
          ref={(el) => {
            if (el) rowRefs.current.set(idx, el);
          }}
          className={`grid grid-cols-[2.75rem_1fr] border-b border-emerald-100 text-[12px] leading-5 ${lineBg("add", hi)}`}
        >
          <span className="select-none py-1.5 pr-2 text-right text-[11px] tabular-nums text-emerald-400">
            {row.rightLine}
          </span>
          <span className="whitespace-pre-wrap break-all py-1.5 pr-3 font-mono">
            {row.rightText || "\u00a0"}
          </span>
        </div>
      );
    }

    return (
      <div
        key={`${side}-${idx}`}
        ref={(el) => {
          if (el && isLeft) rowRefs.current.set(idx, el);
        }}
        className={`grid grid-cols-[2.75rem_1fr] border-b border-amber-100 text-[12px] leading-5 ${lineBg("modify", hi)}`}
      >
        <span className="select-none py-1.5 pr-2 text-right text-[11px] tabular-nums text-amber-400">
          {isLeft ? row.leftLine : row.rightLine}
        </span>
        <span className="whitespace-pre-wrap break-all py-1.5 pr-3 font-mono">
          <InlineParts parts={isLeft ? row.leftParts : row.rightParts} />
        </span>
      </div>
    );
  };

  const renderUnified = (row: AlignedRow, idx: number) => {
    const hi = highlightIdx === idx;
    if (row.kind === "skip") {
      return (
        <div
          key={`u-s-${idx}`}
          className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs text-slate-400"
        >
          {row.count} unchanged lines
        </div>
      );
    }
    if (row.kind === "equal") {
      return (
        <div
          key={`u-${idx}`}
          ref={(el) => {
            if (el) rowRefs.current.set(idx, el);
          }}
          className={`grid grid-cols-[2.75rem_1.25rem_1fr] border-b border-slate-100 text-[12px] leading-5 ${lineBg("equal", hi)}`}
        >
          <span className="select-none py-1.5 pr-2 text-right text-[11px] tabular-nums text-slate-300">
            {row.leftLine}
          </span>
          <span className="select-none py-1.5 text-slate-300"> </span>
          <span className="whitespace-pre-wrap break-all py-1.5 pr-3 font-mono">
            {row.leftText || "\u00a0"}
          </span>
        </div>
      );
    }
    if (row.kind === "del") {
      return (
        <div
          key={`u-${idx}`}
          ref={(el) => {
            if (el) rowRefs.current.set(idx, el);
          }}
          className={`grid grid-cols-[2.75rem_1.25rem_1fr] border-b border-rose-100 text-[12px] leading-5 ${lineBg("del", hi)}`}
        >
          <span className="select-none py-1.5 pr-2 text-right text-[11px] tabular-nums text-rose-300">
            {row.leftLine}
          </span>
          <span className="select-none py-1.5 font-semibold text-rose-500">−</span>
          <span className="whitespace-pre-wrap break-all py-1.5 pr-3 font-mono">
            {row.leftText || "\u00a0"}
          </span>
        </div>
      );
    }
    if (row.kind === "add") {
      return (
        <div
          key={`u-${idx}`}
          ref={(el) => {
            if (el) rowRefs.current.set(idx, el);
          }}
          className={`grid grid-cols-[2.75rem_1.25rem_1fr] border-b border-emerald-100 text-[12px] leading-5 ${lineBg("add", hi)}`}
        >
          <span className="select-none py-1.5 pr-2 text-right text-[11px] tabular-nums text-emerald-400">
            {row.rightLine}
          </span>
          <span className="select-none py-1.5 font-semibold text-emerald-600">+</span>
          <span className="whitespace-pre-wrap break-all py-1.5 pr-3 font-mono">
            {row.rightText || "\u00a0"}
          </span>
        </div>
      );
    }
    return (
      <div
        key={`u-${idx}`}
        ref={(el) => {
          if (el) rowRefs.current.set(idx, el);
        }}
      >
        <div
          className={`grid grid-cols-[2.75rem_1.25rem_1fr] border-b border-rose-100 text-[12px] leading-5 ${lineBg("del", hi)}`}
        >
          <span className="select-none py-1.5 pr-2 text-right text-[11px] tabular-nums text-rose-300">
            {row.leftLine}
          </span>
          <span className="select-none py-1.5 font-semibold text-rose-500">−</span>
          <span className="whitespace-pre-wrap break-all py-1.5 pr-3 font-mono">
            <InlineParts parts={row.leftParts} />
          </span>
        </div>
        <div
          className={`grid grid-cols-[2.75rem_1.25rem_1fr] border-b border-emerald-100 text-[12px] leading-5 ${lineBg("add", hi)}`}
        >
          <span className="select-none py-1.5 pr-2 text-right text-[11px] tabular-nums text-emerald-400">
            {row.rightLine}
          </span>
          <span className="select-none py-1.5 font-semibold text-emerald-600">+</span>
          <span className="whitespace-pre-wrap break-all py-1.5 pr-3 font-mono">
            <InlineParts parts={row.rightParts} />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] w-full bg-slate-100 font-mono text-slate-900">
      {/* Neo-Brutalist Light Header */}
      <header className="shrink-0 border-b-3 border-black bg-white px-4 py-3 sm:px-6 shadow-[0_3px_0_#000000]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--brutal-cyan)] border-2 border-black text-black shrink-0 font-black">
              <GitCompare className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase text-slate-900 tracking-tight">Visual Diff Comparator</h1>
              <p className="text-[11px] font-bold text-slate-500">
                {nameA} ↔ {nameB}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono">
            {!hasChanges ? (
              <span className="brutal-badge brutal-badge-lime text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />
                SAME CONTENT
              </span>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-black">
                <span className="brutal-badge brutal-badge-lime">
                  +{stats.additions}
                </span>
                <span className="brutal-badge brutal-badge-pink">
                  −{stats.deletions}
                </span>
                <span className="brutal-badge brutal-badge-yellow">
                  ~{stats.modifications}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={swapTexts}
              className="brutal-btn !text-xs !py-1.5 !px-3 font-black"
              title="Swap Left ↔ Right input text"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Swap ↔
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="brutal-btn brutal-btn-yellow !text-xs !py-1.5 !px-4 font-black"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Texts
            </button>
          </div>
        </div>
      </header>

      {/* Expanded Diff Options Controls Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 border-b-3 border-black bg-[var(--brutal-yellow)] px-4 py-2.5 sm:px-6 font-mono text-black font-black">
        {/* Split / Unified View Mode */}
        <div className="inline-flex rounded-md border-2 border-black bg-white p-0.5 shadow-[2px_2px_0_#000000]">
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-black transition ${
              viewMode === "split" ? "bg-[var(--brutal-yellow)] text-black" : "text-slate-600"
            }`}
          >
            <Columns2 className="h-3 w-3" />
            Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setViewMode("unified")}
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-black transition ${
              viewMode === "unified" ? "bg-[var(--brutal-cyan)] text-black" : "text-slate-600"
            }`}
          >
            <AlignJustify className="h-3 w-3" />
            Combined
          </button>
        </div>

        {/* Granularity Dropdown */}
        <label className="flex items-center gap-1 text-[11px] font-black uppercase text-black">
          Granularity:
          <select
            className="brutal-input text-[11px] !py-1 !px-2 font-black"
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as DiffGranularity)}
          >
            <option value="word">Word Level</option>
            <option value="char">Character Level</option>
            <option value="line">Line Level</option>
          </select>
        </label>

        {/* Previous / Next Change Navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!hasChanges}
            onClick={() => jumpTo(findPrevChangeIndex(rows, highlightIdx))}
            className="brutal-btn !py-1 !px-2 text-xs font-black disabled:opacity-40"
            aria-label="Previous change"
            title="Previous change"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={!hasChanges}
            onClick={() => jumpTo(findNextChangeIndex(rows, highlightIdx))}
            className="brutal-btn !py-1 !px-2 text-xs font-black disabled:opacity-40"
            aria-label="Next change"
            title="Next change"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Ignore Options Checkboxes */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-black uppercase">
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 accent-black rounded border-2 border-black"
              checked={ignoreCase}
              onChange={(e) => setIgnoreCase(e.target.checked)}
            />
            Ignore Case
          </label>

          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 accent-black rounded border-2 border-black"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
            />
            Ignore Spaces
          </label>

          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 accent-black rounded border-2 border-black"
              checked={ignoreEmptyLines}
              onChange={(e) => setIgnoreEmptyLines(e.target.checked)}
            />
            Ignore Empty Lines
          </label>

          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 accent-black rounded border-2 border-black"
              checked={ignoreComments}
              onChange={(e) => setIgnoreComments(e.target.checked)}
            />
            Ignore Comments (# //)
          </label>

          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 accent-black rounded border-2 border-black"
              checked={trimLines}
              onChange={(e) => setTrimLines(e.target.checked)}
            />
            Trim Lines
          </label>

          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 accent-black rounded border-2 border-black"
              checked={collapseUnchangedLines}
              onChange={(e) => setCollapseUnchangedLines(e.target.checked)}
            />
            Fold Unchanged
          </label>
        </div>

        {/* Action Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(patch);
              setCopied(true);
              flash("Patch copied");
              window.setTimeout(() => setCopied(false), 1800);
            }}
            className="brutal-btn brutal-btn-lime !text-xs !py-1 !px-3 font-black"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copy Patch
          </button>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([patch], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "changes.diff";
              a.click();
              URL.revokeObjectURL(url);
              flash("Downloaded changes.diff");
            }}
            className="brutal-btn brutal-btn-cyan !text-xs !py-1 !px-3 font-black"
          >
            <Download className="h-3.5 w-3.5" />
            .diff
          </button>
        </div>
      </div>

      {/* ONE big result */}
      <main className="relative mx-3 mb-3 mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:mx-4 sm:mb-4">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2">
          <p className="text-xs text-slate-400">
            <span className="mr-3 inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> added
            </span>
            <span className="mr-3 inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-400" /> removed
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> changed
            </span>
          </p>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="text-xs font-medium text-sky-600 hover:text-sky-700"
          >
            Change input texts →
          </button>
        </div>

        {viewMode === "split" ? (
          <div className="grid min-h-0 flex-1 md:grid-cols-2">
            <div
              ref={leftScrollRef}
              onScroll={() => onSyncScroll("left")}
              className="min-h-0 overflow-auto border-b border-slate-100 md:border-b-0 md:border-r md:border-slate-100"
            >
              <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 px-3 py-1.5 text-[11px] font-medium text-slate-500 backdrop-blur">
                Original
              </div>
              {rows.map((row, idx) => renderSplit(row, idx, "left"))}
            </div>
            <div
              ref={rightScrollRef}
              onScroll={() => onSyncScroll("right")}
              className="min-h-0 overflow-auto"
            >
              <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 px-3 py-1.5 text-[11px] font-medium text-slate-500 backdrop-blur">
                Modified
              </div>
              {rows.map((row, idx) => renderSplit(row, idx, "right"))}
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            {rows.map((row, idx) => renderUnified(row, idx))}
          </div>
        )}
      </main>

      {/* Drawer: editors only */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl animate-in slide-in-from-right sm:max-w-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Edit texts</h2>
                <p className="text-[11px] text-slate-400">
                  Paste or upload — results update live
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
              {/* Original */}
              <div className="flex min-h-[40%] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800">Original</p>
                    <p className="truncate text-[11px] text-slate-400">{nameA}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileARef}
                      type="file"
                      className="hidden"
                      accept=".txt,.md,.ts,.tsx,.js,.jsx,.py,.json,.yaml,.yml,.css,.html,.tex,.c,.cpp,.rs,.go,.java,.sh,.sdc,.tcl"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) loadFile("a", f);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileARef.current?.click()}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <Upload className="h-3 w-3" />
                      File
                    </button>
                  </div>
                </div>
                <textarea
                  value={textA}
                  onChange={(e) => setTextA(e.target.value)}
                  spellCheck={false}
                  placeholder="Paste original…"
                  className="min-h-[8rem] flex-1 resize-none border-0 px-3 py-2 font-mono text-[12px] leading-relaxed text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setTextA(textB);
                    setTextB(textA);
                    setNameA(nameB);
                    setNameB(nameA);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Swap
                </button>
              </div>

              {/* Modified */}
              <div className="flex min-h-[40%] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800">Modified</p>
                    <p className="truncate text-[11px] text-slate-400">{nameB}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileBRef}
                      type="file"
                      className="hidden"
                      accept=".txt,.md,.ts,.tsx,.js,.jsx,.py,.json,.yaml,.yml,.css,.html,.tex,.c,.cpp,.rs,.go,.java,.sh,.sdc,.tcl"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) loadFile("b", f);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileBRef.current?.click()}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <Upload className="h-3 w-3" />
                      File
                    </button>
                  </div>
                </div>
                <textarea
                  value={textB}
                  onChange={(e) => setTextB(e.target.value)}
                  spellCheck={false}
                  placeholder="Paste modified…"
                  className="min-h-[8rem] flex-1 resize-none border-0 px-3 py-2 font-mono text-[12px] leading-relaxed text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 p-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Done — view results
              </button>
            </div>
          </aside>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
