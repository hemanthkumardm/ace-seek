"use client";

import React, { useMemo } from "react";
import { marked } from "marked";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LiveDocumentPreviewProps {
  content: string;
  className?: string;
  isWide?: boolean;
}

export function LiveDocumentPreview({ content, className = "", isWide = false }: LiveDocumentPreviewProps) {
  const renderedHtml = useMemo(() => {
    if (!content || !content.trim()) {
      return `<div class="text-slate-400 text-sm italic p-8 text-center">Type in the editor on the left to see instant live preview…</div>`;
    }

    let processed = content;

    // 1. Render block math $$...$$ via KaTeX
    processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_match, math) => {
      try {
        return `<div class="my-4 overflow-x-auto py-2 text-center">${katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
        })}</div>`;
      } catch {
        return `<pre class="text-rose-600 font-mono text-xs">$$${math}$$</pre>`;
      }
    });

    // 2. Render inline math $...$ via KaTeX
    processed = processed.replace(/\$([^\$\n]+?)\$/g, (_match, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        return `<code class="text-rose-600 font-mono text-xs">$${math}$</code>`;
      }
    });

    // 3. Configure marked options
    marked.setOptions({
      gfm: true,
      breaks: true,
    });

    try {
      return marked.parse(processed) as string;
    } catch (err) {
      console.error("Markdown parse error:", err);
      return `<pre class="text-rose-600">${content}</pre>`;
    }
  }, [content]);

  return (
    <div
      className={`live-preview-container w-full h-full overflow-y-auto bg-white p-6 sm:p-10 font-sans text-slate-800 text-sm leading-relaxed ${className}`}
    >
      <div className={`mx-auto ${isWide ? "max-w-full" : "max-w-4xl"}`}>
        <article
          className="live-doc-article w-full max-w-none"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    </div>
  );
}
