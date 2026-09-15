"use client";

import React, { useMemo } from "react";
import { Lightbulb, AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import {
  buildPnrCoach,
  type CoachSeverity,
  type CoachMetrics,
} from "@/lib/openroad-pnr-coach";

type Props = {
  logLines?: string[];
  logText?: string;
  metrics?: CoachMetrics | null;
  compact?: boolean;
};

function iconFor(sev: CoachSeverity) {
  switch (sev) {
    case "critical":
      return <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    case "warn":
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    case "ok":
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    default:
      return <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
  }
}

function badge(sev: CoachSeverity) {
  if (sev === "critical") return "bg-rose-50 text-rose-800 border-rose-200";
  if (sev === "warn") return "bg-amber-50 text-amber-900 border-amber-200";
  if (sev === "ok") return "bg-emerald-50 text-emerald-900 border-emerald-200";
  return "bg-sky-50 text-sky-900 border-sky-200";
}

export function OpenroadPnrCoach({ logLines, logText, metrics, compact }: Props) {
  const tips = useMemo(() => {
    const text = logText || (logLines || []).join("\n");
    return buildPnrCoach({ logText: text, metrics, maxTips: compact ? 4 : 8 });
  }, [logLines, logText, metrics, compact]);

  if (!tips.length) return null;

  return (
    <div className="neu-inset p-3 space-y-2 border border-violet-200/60 bg-violet-50/40">
      <p className="text-[10px] font-black uppercase text-violet-900 flex items-center gap-1.5">
        <Lightbulb className="w-3.5 h-3.5 text-violet-600" /> PnR coach
      </p>
      <ul className="space-y-1.5">
        {tips.map((t) => (
          <li
            key={t.id}
            className={`rounded-lg border px-2 py-1.5 text-[10px] font-bold ${badge(t.severity)}`}
          >
            <div className="flex items-start gap-1.5">
              {iconFor(t.severity)}
              <div className="min-w-0 space-y-0.5">
                <p className="font-black">
                  {t.headline}
                  {t.stage ? (
                    <span className="ml-1 font-mono opacity-70">· {t.stage}</span>
                  ) : null}
                </p>
                <p className="opacity-90 leading-snug">{t.tip}</p>
                {t.evidence && !compact ? (
                  <p className="font-mono text-[9px] opacity-60 truncate" title={t.evidence}>
                    {t.evidence}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
