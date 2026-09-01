"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Terminal } from "lucide-react";
import { GVIM_TEMPLATE, gvimKey, initialGvim, type GvimState } from "@/lib/lang-labs/gvim";

const CHEATS = [
  ["h j k l", "move"],
  ["i  Esc", "insert / normal"],
  ["0  $  gg  G", "line / file"],
  ["x  dd  yy  p", "edit"],
  ["/pat  n", "search"],
  [":%s/old/new/g", "substitute"],
  [":g/TODO/d", "global delete"],
];

export function GvimSandbox({ template = GVIM_TEMPLATE }: { template?: string }) {
  const [st, setSt] = useState<GvimState>(() => initialGvim(template));
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    box.current?.focus();
  }, []);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    const ignore = ["Tab", "Shift", "Control", "Alt", "Meta", "CapsLock"];
    if (ignore.includes(e.key)) return;
    e.preventDefault();
    setSt((prev) => gvimKey(prev, e.key, e.ctrlKey));
  }, []);

  const prompt =
    st.mode === "cmdline" ? `:${st.cmd}` : st.mode === "search" ? `/${st.cmd}` : st.message;

  return (
    <div
      className="ln-card my-6 overflow-hidden rounded-xl"
      style={{ border: "1px solid var(--ln-border)", background: "var(--ln-bg-elev)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--ln-border)]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" style={{ color: "var(--ln-accent)" }} />
          <div>
            <h3 className="text-sm font-bold">GVim lab — type on this buffer</h3>
            <p className="text-[11px]" style={{ color: "var(--ln-muted)" }}>
              Real modes. Click the editor, then type like you would in gvim.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="ln-btn text-xs"
          onClick={() => {
            setSt(initialGvim(template));
            box.current?.focus();
          }}
        >
          Reset template
        </button>
      </div>
      <div className="grid lg:grid-cols-[1fr_11rem] gap-0">
        <div
          ref={box}
          tabIndex={0}
          onKeyDown={onKey}
          className="font-mono text-[12px] leading-5 p-3 outline-none min-h-[280px] cursor-text"
          style={{ background: "var(--ln-code-bg)", color: "var(--ln-code-fg)" }}
        >
          {st.lines.map((ln, r) => (
            <div key={r} className="flex gap-3">
              <span className="w-6 text-right opacity-40 select-none">{r + 1}</span>
              <span className="whitespace-pre-wrap">
                {r === st.row ? (
                  <>
                    {ln.slice(0, st.col)}
                    <span
                      className="inline-block w-[7px] h-[14px] align-middle"
                      style={{
                        background: st.mode === "insert" ? "#22d3ee" : "#fbbf24",
                      }}
                    />
                    {ln.slice(st.col)}
                  </>
                ) : (
                  ln || " "
                )}
              </span>
            </div>
          ))}
        </div>
        <aside className="p-3 text-[11px] border-t lg:border-t-0 lg:border-l border-[var(--ln-border)] space-y-1.5">
          <div className="font-bold uppercase tracking-wider" style={{ color: "var(--ln-muted)" }}>
            Cheatsheet
          </div>
          {CHEATS.map(([k, d]) => (
            <div key={k}>
              <code className="font-mono text-[var(--ln-accent)]">{k}</code>
              <div style={{ color: "var(--ln-muted)" }}>{d}</div>
            </div>
          ))}
        </aside>
      </div>
      <div
        className="px-3 py-1.5 font-mono text-[12px] border-t border-[var(--ln-border)] flex justify-between"
        style={{ background: "var(--ln-code-bg)", color: "var(--ln-code-fg)" }}
      >
        <span>{prompt}</span>
        <span className="opacity-60">
          {st.mode.toUpperCase()}  {st.row + 1},{st.col + 1}
        </span>
      </div>
    </div>
  );
}
