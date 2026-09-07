"use client";

import React, { useMemo } from "react";
import { marked } from "marked";
import katex from "katex";
import "katex/dist/katex.min.css";

interface InterviewMathSolutionRendererProps {
  content: string;
  className?: string;
}

export function InterviewMathSolutionRenderer({
  content,
  className = "",
}: InterviewMathSolutionRendererProps) {
  const renderedHtml = useMemo(() => {
    if (!content || !content.trim()) return "";

    const mathStore: Record<string, string> = {};
    let mathIndex = 0;

    let processed = content;

    const storeBlock = (math: string) => {
      const key = `MATHBLOCKPLACEHOLDER${mathIndex++}XYZ`;
      try {
        const rendered = katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
        });
        mathStore[key] = `<div class="my-3.5 py-3 px-4 rounded-xl bg-slate-950 border border-amber-400/40 text-amber-200 overflow-x-auto shadow-inner text-center font-medium">${rendered}</div>`;
      } catch {
        mathStore[key] = `<div class="my-2 p-3 rounded-lg bg-slate-950 border border-amber-500/30 font-mono text-amber-300 text-center">${math}</div>`;
      }
      return `\n\n${key}\n\n`;
    };

    const storeInline = (math: string) => {
      const key = `MATHINLINEPLACEHOLDER${mathIndex++}XYZ`;
      try {
        const rendered = katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        });
        mathStore[key] = `<span class="inline-block px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-medium">${rendered}</span>`;
      } catch {
        mathStore[key] = `<code class="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 font-mono text-xs">${math}</code>`;
      }
      return key;
    };

    // 1. Block math: $$...$$ and \[...\]
    processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_m, math) => storeBlock(math));
    processed = processed.replace(/\\\[([\s\S]+?)\\\]/g, (_m, math) => storeBlock(math));

    // 2. Inline math: $...$ and \(...\)  (LaTeX delimiters used heavily in aptitude/DV packs)
    processed = processed.replace(/\\\(([\s\S]+?)\\\)/g, (_m, math) => storeInline(math));
    processed = processed.replace(/\$([^\$\n]+?)\$/g, (_m, math) => storeInline(math));

    // 3. Un-indent GFM tables so marked parses them (MD→JSON often left leading spaces)
    processed = processed.replace(/(^|\n)[ \t]+(\|[^\n]+\|)/g, "$1$2");

    // 3. Configure marked and parse markdown
    marked.setOptions({
      gfm: true,
      breaks: true,
    });

    let html = marked.parse(processed) as string;

    // 4. Restore math placeholders
    for (const [key, renderedMath] of Object.entries(mathStore)) {
      html = html.replace(new RegExp(key, "g"), renderedMath);
    }

    return html;
  }, [content]);

  return (
    <div
      className={`prose prose-invert max-w-none text-slate-100 text-xs md:text-sm leading-relaxed 
        [&_h3]:text-sm [&_h3]:md:text-base [&_h3]:font-bold [&_h3]:text-amber-300 [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:pb-1.5 [&_h3]:border-b [&_h3]:border-slate-700
        [&_h4]:text-xs [&_h4]:md:text-sm [&_h4]:font-bold [&_h4]:text-cyan-300 [&_h4]:mt-3 [&_h4]:mb-1
        [&_p]:text-slate-200 [&_p]:leading-relaxed [&_p]:my-2
        [&_strong]:text-white [&_strong]:font-bold
        [&_ul]:my-2 [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:list-disc [&_ul]:marker:text-cyan-400
        [&_ol]:my-2 [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:list-decimal [&_ol]:marker:text-amber-400
        [&_li]:text-slate-200 [&_li]:leading-relaxed
        [&_table]:w-full [&_table]:my-3 [&_table]:border [&_table]:border-slate-700 [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:bg-slate-950
        [&_thead]:bg-slate-800 [&_thead]:text-amber-300 [&_thead]:font-bold [&_thead]:border-b [&_thead]:border-slate-700
        [&_th]:p-3 [&_th]:text-left [&_th]:text-xs
        [&_td]:p-3 [&_td]:text-xs [&_td]:font-mono [&_td]:border-b [&_td]:border-slate-800
        [&_tr:hover]:bg-slate-900/80
        [&_.katex]:text-[1.05em] [&_.katex-display]:my-2
        ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
