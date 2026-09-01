"use client";

import React, { useMemo, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { runLang, type LabResult } from "@/lib/lang-labs/run-lang";
import { GvimSandbox } from "./GvimSandbox";

const SAMPLES: Record<string, { title: string; starter: string; hint: string }> = {
  tcl: {
    title: "Tcl try-it",
    hint: "Teaching interpreter: set, puts, expr, if, for, foreach, proc, list, string.",
    starter: `set clocks {clk_core clk_periph clk_scan}
set period 2.0

proc emit {names t} {
  foreach n $names {
    puts "create_clock -name $n -period $t"
  }
}

emit $clocks $period
puts "count = [llength $clocks]"
`,
  },
  bash: {
    title: "Bash try-it",
    hint: "Variables, echo, for, and pipes (grep / awk / wc).",
    starter: `CORNER=ss_0p72v_125c
echo "STA corner is $CORNER"

for f in timing.rpt power.rpt area.rpt; do
  echo "harvest $f"
done

echo "slack (VIOLATED) -0.42" | grep VIOLATED
`,
  },
  python: {
    title: "Python try-it",
    hint: "print, assignment, lists, for range(), f-strings, len().",
    starter: `cells = ["dfxtp_1", "nand2_1", "inv_2"]
print(f"instances = {len(cells)}")
print(cells[0])

count = 0
for i in range(3):
    count = i
    print(f"tick {i}")
`,
  },
  perl: {
    title: "Perl try-it",
    hint: "my $scalar, my @array, print, foreach.",
    starter: `my $wns = "-0.42";
my @paths = ("alu/q", "mac/acc", "uart/tx");
print "WNS=$wns\\n";
foreach my $p (@paths) {
  print "endpoint $p\\n";
}
`,
  },
  xml: {
    title: "XML / XPath try-it",
    hint: "Edit XML on the left, XPath on the right, then Run.",
    starter: `<timing_report>
  <path type="setup"><endpoint>u_alu/q</endpoint><slack>-0.42</slack></path>
  <path type="hold"><endpoint>u_mac/acc</endpoint><slack>0.05</slack></path>
</timing_report>`,
  },
};

export function LangTryLab({
  lang,
  starter,
  title,
}: {
  lang: string;
  starter?: string;
  title?: string;
}) {
  const key = lang.toLowerCase();
  if (key === "vim" || key === "gvim") return <GvimSandbox />;

  const sample = SAMPLES[key] || SAMPLES.tcl;
  const [code, setCode] = useState(starter || sample.starter);
  const [xpath, setXpath] = useState("/timing_report/path[@type='setup']/slack");
  const [result, setResult] = useState<LabResult | null>(null);

  const run = () => {
    setResult(runLang(key, code, key === "xml" ? xpath : undefined));
  };

  const banner = title || sample.title;
  const hint = sample.hint;

  const examples = useMemo(() => {
    if (key === "tcl")
      return [
        ["set / puts", "set x 3\nputs [expr {$x * 2}]"],
        ["foreach", "foreach c {a b c} { puts $c }"],
        ["proc", "proc add {a b} { expr {$a+$b} }\nputs [add 3 4]"],
      ];
    if (key === "bash")
      return [
        ["vars", 'NAME=alu\necho "block $NAME"'],
        ["for", "for i in 1 2 3; do\n  echo tick $i\ndone"],
      ];
    if (key === "python")
      return [
        ["print", 'print("hello VLSI")\nx = 4\nprint(x)'],
        ["list", 'p = ["clk", "rst_n"]\nprint(len(p))\nprint(p[0])'],
      ];
    if (key === "perl")
      return [
        ["scalar", 'my $n = 3;\nprint "n=$n\\n";'],
        ["array", 'my @c = ("clk", "rst");\nforeach my $x (@c) {\n  print "$x\\n";\n}'],
      ];
    return [];
  }, [key]);

  return (
    <div className="my-6 space-y-3">
      {examples.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {examples.map(([label, src]) => (
            <button
              key={label}
              type="button"
              className="ln-btn !py-1 !px-2 text-[11px]"
              onClick={() => {
                setCode(src);
                setResult(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl shadow-lg border border-black/20">
        <div className="flex items-center justify-between px-4 py-2 bg-[#2b2b2b] text-white">
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            </span>
            <span className="text-[12px] font-medium opacity-90">{banner}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-[11px] px-2 py-1 rounded bg-white/10 hover:bg-white/20"
              onClick={() => {
                setCode(starter || sample.starter);
                setResult(null);
              }}
            >
              <RotateCcw className="w-3 h-3 inline mr-1" />
              Reset
            </button>
            <button
              type="button"
              onClick={run}
              className="text-[12px] font-semibold px-3 py-1 rounded bg-white text-slate-900 hover:bg-slate-100"
            >
              <Play className="w-3 h-3 inline mr-1" />
              Edit &amp; Run
            </button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full min-h-[220px] p-4 font-mono text-[13px] outline-none resize-y bg-[#1e1e1e] text-[#d4d4d4]"
        />
        {key === "xml" && (
          <div className="px-4 py-2 bg-[#252526] border-t border-white/10">
            <label className="text-[11px] text-slate-400">
              XPath
              <input
                value={xpath}
                onChange={(e) => setXpath(e.target.value)}
                className="w-full mt-1 px-2 py-1 rounded bg-[#1e1e1e] text-cyan-300 font-mono text-xs border border-white/10"
              />
            </label>
          </div>
        )}
        <div className="bg-white text-slate-800 px-4 py-3 min-h-[72px] font-mono text-[13px]">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
            {result && !result.ok ? "Warnings / Errors" : "Output"}
          </div>
          {!result && <p className="text-slate-400">Click Edit &amp; Run.</p>}
          {result?.ok && (
            <pre className="whitespace-pre-wrap text-emerald-700">{result.stdout || "(no output)"}</pre>
          )}
          {result && !result.ok && (
            <pre className="whitespace-pre-wrap text-rose-700">
              {result.stdout ? `${result.stdout}\n` : ""}
              {result.error}
            </pre>
          )}
        </div>
      </div>
      <p className="text-[12px]" style={{ color: "var(--ln-muted)" }}>
        {hint} Teaching subset — not a full {lang} compiler.
      </p>
    </div>
  );
}
