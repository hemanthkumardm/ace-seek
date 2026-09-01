"use client";

import React, { useMemo, useState } from "react";
import { Boxes, Copy, Check } from "lucide-react";
import {
  CADENCE_ATTRS,
  CADENCE_COMMANDS,
  CADENCE_FLOW,
  CADENCE_GETDB,
  CADENCE_METHODS,
  CADENCE_TOOLS,
  type CadenceTool,
} from "@/lib/cadence-ref";

export function CadenceCommandStudio({ initialTool = "genus" }: { initialTool?: CadenceTool }) {
  const [tool, setTool] = useState<CadenceTool>(initialTool);
  const [cmdName, setCmdName] = useState(CADENCE_COMMANDS.find((c) => c.tool === initialTool)?.name || "get_db");
  const [copied, setCopied] = useState(false);

  const cmds = useMemo(() => CADENCE_COMMANDS.filter((c) => c.tool === tool || c.name === "get_db" || c.name === "set_db"), [tool]);
  const cmd = cmds.find((c) => c.name === cmdName) || cmds[0];
  const attrs = CADENCE_ATTRS.filter((a) => a.tool === tool || (tool === "genus" && a.tool === "genus"));
  const flow = CADENCE_FLOW[tool];
  const meta = CADENCE_TOOLS.find((t) => t.id === tool)!;

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className="ln-card my-6 overflow-hidden rounded-xl"
      style={{ border: "1px solid var(--ln-border)", background: "var(--ln-bg-elev)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--ln-border)]">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4" style={{ color: "var(--ln-accent)" }} />
          <div>
            <h3 className="text-sm font-bold">Cadence command studio</h3>
            <p className="text-[11px]" style={{ color: "var(--ln-muted)" }}>
              PLAN-derived Genus / Innovus / Tempus / Voltus / LEC — technology-agnostic open syntax.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {CADENCE_TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`ln-btn !py-1 !px-2 text-[11px] ${tool === t.id ? "ln-btn-primary" : ""}`}
              onClick={() => {
                setTool(t.id);
                const next = CADENCE_COMMANDS.find((c) => c.tool === t.id);
                if (next) setCmdName(next.name);
              }}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-[var(--ln-border)]">
        <p className="text-[12px] font-semibold mb-2">
          {meta.shell} — {meta.job}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {flow.map((step, i) => (
            <React.Fragment key={step}>
              {i > 0 && <span style={{ color: "var(--ln-muted)" }}>→</span>}
              <code
                className="text-[11px] px-2 py-0.5 rounded"
                style={{ background: "var(--ln-code-bg)", color: "var(--ln-accent)" }}
              >
                {step}
              </code>
            </React.Fragment>
          ))}
        </div>
      </div>

      {tool === "genus" && (
        <MethodRow title="Genus methods" items={CADENCE_METHODS.syn.map((m) => `${m.id}: ${m.what}`)} />
      )}
      {tool === "innovus" && (
        <>
          <MethodRow title="P&R stages" items={CADENCE_METHODS.pnr_stages} />
          <MethodRow title="CTS methods" items={CADENCE_METHODS.cts.map((m) => `${m.id} — ${m.what}`)} />
          <MethodRow title="PDN methods" items={CADENCE_METHODS.pdn.map((m) => `${m.id} — ${m.what}`)} />
        </>
      )}

      <div className="grid md:grid-cols-[14rem_1fr] gap-0 border-t border-[var(--ln-border)]">
        <div className="p-2 border-b md:border-b-0 md:border-r border-[var(--ln-border)] max-h-[360px] overflow-y-auto">
          {cmds.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCmdName(c.name)}
              className="w-full text-left px-2 py-1.5 rounded text-[12px] font-mono"
              style={{
                background: cmd?.name === c.name ? "var(--ln-accent-soft)" : "transparent",
                color: cmd?.name === c.name ? "var(--ln-accent)" : "var(--ln-text)",
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
        {cmd && (
          <div className="p-4 space-y-3 text-[13px]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold font-mono">{cmd.name}</h4>
                <p className="text-[12px]" style={{ color: "var(--ln-muted)" }}>
                  {cmd.tool} · {cmd.group}
                </p>
              </div>
              <button type="button" className="ln-btn !py-1 !px-2 text-[11px]" onClick={() => copy(cmd.example)}>
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Copy
              </button>
            </div>
            <pre className="text-[12px] p-2 rounded overflow-x-auto" style={{ background: "var(--ln-hover)" }}>
              {cmd.usage}
            </pre>
            {cmd.flags && (
              <p className="text-[12px]">
                <span className="font-semibold">Flags: </span>
                {cmd.flags.map((f) => (
                  <code key={f} className="mr-1.5" style={{ color: "var(--ln-accent)" }}>
                    {f}
                  </code>
                ))}
              </p>
            )}
            <p style={{ color: "var(--ln-muted)" }}>{cmd.note}</p>
            <pre
              className="text-[12px] p-3 rounded-lg overflow-x-auto"
              style={{ background: "var(--ln-code-bg)", color: "var(--ln-code-fg)" }}
            >
              {cmd.example}
            </pre>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[var(--ln-border)] space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ln-muted)" }}>
          get_db vs Synopsys collections
        </h4>
        <table className="w-full text-[12px]">
          <tbody>
            {CADENCE_GETDB.map((row) => (
              <tr key={row.q} style={{ borderTop: "1px solid var(--ln-border)" }}>
                <td className="py-1.5 pr-3 font-mono" style={{ color: "var(--ln-accent)" }}>
                  {row.q}
                </td>
                <td className="py-1.5" style={{ color: "var(--ln-muted)" }}>
                  {row.a}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {attrs.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--ln-muted)" }}>
            Key set_db attributes
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: "var(--ln-hover)" }}>
                  <th className="text-left px-2 py-1">Attribute</th>
                  <th className="text-left px-2 py-1">Type</th>
                  <th className="text-left px-2 py-1">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {attrs.map((a) => (
                  <tr key={a.name} style={{ borderTop: "1px solid var(--ln-border)" }}>
                    <td className="px-2 py-1 font-mono">{a.name}</td>
                    <td className="px-2 py-1">{a.type}{a.def ? ` = ${a.def}` : ""}</td>
                    <td className="px-2 py-1" style={{ color: "var(--ln-muted)" }}>
                      {a.help}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MethodRow({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="px-4 py-2 border-b border-[var(--ln-border)]">
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--ln-muted)" }}>
        {title}
      </p>
      <div className="flex flex-wrap gap-1">
        {items.map((it) => (
          <span
            key={it}
            className="text-[11px] px-2 py-0.5 rounded-full"
            style={{ background: "var(--ln-hover)", color: "var(--ln-text)" }}
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
