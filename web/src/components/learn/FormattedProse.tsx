"use client";

import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Copy,
  Check,
  Terminal,
} from "lucide-react";
import { parseTheoryArticle, type TheoryNode } from "@/lib/theory-blocks";
import { LangTryLab } from "./LangTryLab";

export function formatInlineText(text: string): React.ReactNode[] {
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="px-1 py-0.5 mx-0.5 rounded text-[12.5px] font-mono"
          style={{
            background: "var(--ln-code-bg)",
            color: "var(--ln-accent)",
            border: "1px solid var(--ln-border)",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold" style={{ color: "var(--ln-text)" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function CodeBox({ code, language, title }: { code: string; language: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className="my-3 rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--ln-border)", background: "var(--ln-code-bg)" }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 text-[11px]"
        style={{ borderBottom: "1px solid var(--ln-border)", color: "var(--ln-muted)" }}
      >
        <span className="flex items-center gap-1.5 font-semibold">
          <Terminal className="w-3.5 h-3.5" />
          {title || "Example"}
          <span className="uppercase tracking-wider opacity-70">{language}</span>
        </span>
        <button
          type="button"
          className="ln-btn !py-0.5 !px-2 text-[10px]"
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-3 font-mono text-[12.5px] leading-relaxed overflow-x-auto" style={{ color: "var(--ln-code-fg)" }}>
        {code}
      </pre>
    </div>
  );
}

function NodeView({ node, i }: { node: TheoryNode; i: number }) {
  if (node.t === "divider") {
    return (
      <hr
        className="my-6 border-0 h-px"
        style={{ background: "var(--ln-border)" }}
      />
    );
  }
  if (node.t === "h") {
    if (node.level === 1) {
      return (
        <h1 className="text-lg font-extrabold mt-8 mb-3 tracking-tight" style={{ color: "var(--ln-text)" }}>
          {formatInlineText(node.text)}
        </h1>
      );
    }
    if (node.level === 3) {
      return (
        <h3 className="text-sm font-bold mt-6 mb-2 tracking-tight flex items-center gap-1.5" style={{ color: "var(--ln-text)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--ln-accent)]" />
          {formatInlineText(node.text)}
        </h3>
      );
    }
    if (node.level === 4) {
      return (
        <h4 className="text-xs font-bold uppercase tracking-wider mt-4 mb-1.5" style={{ color: "var(--ln-muted)" }}>
          {formatInlineText(node.text)}
        </h4>
      );
    }
    return (
      <h2 className="text-base font-bold mt-8 mb-2 tracking-tight" style={{ color: "var(--ln-text)" }}>
        {formatInlineText(node.text)}
      </h2>
    );
  }
  if (node.t === "p") {
    return (
      <p className="text-[14px] leading-[1.75]" style={{ color: "var(--ln-text)" }}>
        {formatInlineText(node.text)}
      </p>
    );
  }
  if (node.t === "card") {
    return (
      <div
        className="rounded-xl p-4"
        style={{ border: "1px solid var(--ln-border)", background: "var(--ln-bg-elev)" }}
      >
        <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: "1px solid var(--ln-border)" }}>
          <BookOpen className="w-4 h-4" style={{ color: "var(--ln-accent)" }} />
          <h3 className="text-sm font-bold">{formatInlineText(node.title)}</h3>
        </div>
        <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--ln-muted)" }}>
          {formatInlineText(node.text)}
        </p>
      </div>
    );
  }
  if (node.t === "ul" || node.t === "ol") {
    const Tag = node.t === "ul" ? "ul" : "ol";
    return (
      <Tag className={`text-[14px] leading-relaxed space-y-1.5 pl-5 ${node.t === "ul" ? "list-disc" : "list-decimal"}`}>
        {node.items.map((it, j) => (
          <li key={j}>{formatInlineText(it)}</li>
        ))}
      </Tag>
    );
  }
  if (node.t === "table") {
    return (
      <div className="my-4 overflow-x-auto rounded-xl" style={{ border: "1px solid var(--ln-border)" }}>
        {node.caption && (
          <div
            className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider"
            style={{ background: "var(--ln-accent-soft)", color: "var(--ln-accent)" }}
          >
            {node.caption || (node.kind === "compare" ? "Comparison" : "Table")}
          </div>
        )}
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr style={{ background: node.kind === "compare" ? "var(--ln-accent-soft)" : "var(--ln-hover)" }}>
              {node.headers.map((h, j) => (
                <th key={j} className="text-left px-3 py-2 font-bold" style={{ color: "var(--ln-text)" }}>
                  {formatInlineText(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {node.rows.map((row, r) => (
              <tr key={r} style={{ borderTop: "1px solid var(--ln-border)" }}>
                {row.map((c, j) => (
                  <td
                    key={j}
                    className="px-3 py-2 align-top"
                    style={{ color: j === 0 ? "var(--ln-text)" : "var(--ln-muted)", fontWeight: j === 0 ? 600 : 400 }}
                  >
                    {formatInlineText(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (node.t === "qa") {
    return (
      <details
        className="rounded-xl p-3 group"
        style={{ border: "1px solid var(--ln-border)", background: "var(--ln-bg-elev)" }}
      >
        <summary className="flex items-start gap-2 cursor-pointer list-none font-semibold text-[13.5px]">
          <HelpCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--ln-accent)" }} />
          <span>{formatInlineText(node.q)}</span>
        </summary>
        <p className="mt-2 pl-6 text-[13.5px] leading-relaxed" style={{ color: "var(--ln-muted)" }}>
          {formatInlineText(node.a || "Think it through, then check the quiz.")}
        </p>
      </details>
    );
  }
  if (node.t === "callout") {
    const tone = node.tone;
    const icon =
      tone === "warn" ? (
        <AlertTriangle className="w-4 h-4" />
      ) : tone === "tip" || tone === "example" ? (
        <Lightbulb className="w-4 h-4" />
      ) : (
        <BookOpen className="w-4 h-4" />
      );
    const label = tone === "warn" ? "Watch out" : tone === "tip" ? "Tip" : tone === "example" ? "Example" : "Note";
    return (
      <div
        className="rounded-xl p-3.5 flex gap-2.5 text-[13.5px] leading-relaxed"
        style={{
          border: "1px solid var(--ln-border)",
          background: tone === "warn" ? "color-mix(in srgb, var(--ln-bad) 10%, var(--ln-bg-elev))" : "var(--ln-bg-elev)",
        }}
      >
        <div style={{ color: tone === "warn" ? "var(--ln-bad)" : "var(--ln-accent)" }}>{icon}</div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--ln-muted)" }}>
            {label}
          </div>
          {formatInlineText(node.text)}
        </div>
      </div>
    );
  }
  if (node.t === "flow") {
    return (
      <div className="flex flex-wrap items-center gap-1.5 my-3">
        {node.steps.map((step, j) => (
          <React.Fragment key={j}>
            {j > 0 && <ArrowRight className="w-3.5 h-3.5" style={{ color: "var(--ln-muted)" }} />}
            <span
              className="px-2.5 py-1 rounded-lg text-[12px] font-semibold"
              style={{ background: "var(--ln-accent-soft)", color: "var(--ln-accent)", border: "1px solid var(--ln-border)" }}
            >
              {formatInlineText(step)}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  }
  if (node.t === "code") {
    return <CodeBox code={node.code} language={node.lang} />;
  }
  if (node.t === "try") {
    return <LangTryLab lang={node.lang} starter={node.code} />;
  }
  return null;
}

export function FormattedProse({
  paragraphs,
  className = "",
}: {
  paragraphs: string[];
  className?: string;
}) {
  const nodes = useMemo(() => parseTheoryArticle(paragraphs), [paragraphs]);
  return (
    <div className={`space-y-4 w-full max-w-5xl xl:max-w-6xl ${className}`}>
      {nodes.map((n, i) => (
        <NodeView key={i} node={n} i={i} />
      ))}
    </div>
  );
}
