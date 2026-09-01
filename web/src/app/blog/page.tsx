import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { BookOpen, FileText, ExternalLink, Code, Sparkles, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description: "Engineering notes on VLSI, SDC, and technical documentation pipelines.",
};

const POSTS = [
  {
    title: "Why unfenced Tcl breaks Markdown → PDF (and how we fix it)",
    date: "Drafting",
    blurb:
      "Pandoc treats $T as math. Real SDC does not. A short post on the Ace-Seek preprocessor logic.",
    href: "#",
    tag: "PIPELINE",
  },
  {
    title: "Formulating clock uncertainty without the spreadsheet chaos",
    date: "Drafting",
    blurb:
      "Setup vs hold, jitter derates, and a clean path from whiteboard to production SDC lines.",
    href: "#",
    tag: "VLSI TIMING",
  },
  {
    title: "Wide STA tables: when A4 geometry is not enough",
    date: "Drafting",
    blurb:
      "Landscape, A3 page breaking, and custom geometry for box-drawing timing table rendering.",
    href: "#",
    tag: "DOCUMENTATION",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader active="blog" />

      <main className="flex-1 m-shell py-12 md:py-16 space-y-10">
        <div className="sk-panel p-8 space-y-4">
          <div className="flex items-center gap-2">
            <div className="sk-icon-well">
              <BookOpen className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              Engineering Hub
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Technical Blog & Engineering Notes
          </h1>

          <p className="text-xs md:text-sm text-[var(--muted)] max-w-xl leading-relaxed">
            In-depth writeups on VLSI design bottlenecks, Markdown+LaTeX compilation engines, and SDC timing formulations written for hardware engineers.
          </p>
        </div>

        <ul className="space-y-4 max-w-3xl">
          {POSTS.map((post) => (
            <li key={post.title}>
              <article className="sk-panel sk-panel-interactive p-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="sk-badge">{post.tag}</span>
                    <span className="text-[11px] font-mono text-[var(--muted)]">
                      STATUS: {post.date}
                    </span>
                  </div>
                  <span className="sk-badge">
                    <span className="sk-led sk-led-amber" />
                    <span>Upcoming</span>
                  </span>
                </div>

                <h2 className="text-base font-bold text-[var(--foreground)] hover:text-[var(--accent-cyan)] transition-colors">
                  {post.title}
                </h2>

                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {post.blurb}
                </p>
              </article>
            </li>
          ))}
        </ul>

        <div id="scripts" className="sk-panel p-6 max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <div className="sk-icon-well w-7 h-7">
              <Terminal className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            </div>
            <h2 className="text-sm font-bold">Open Script Repository</h2>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Public automation snippets and TCL flow glue will land here — free distribution to empower hardware teams.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
