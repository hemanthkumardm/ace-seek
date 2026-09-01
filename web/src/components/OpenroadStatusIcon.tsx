"use client";

import {
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Lock,
  XCircle,
} from "lucide-react";
import type { StageStatusUi } from "@/lib/openroad-flow-model";

export function OpenroadStatusIcon({ s }: { s: StageStatusUi }) {
  if (s === "done")
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
  if (s === "running")
    return <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" />;
  if (s === "failed") return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
  if (s === "queued") return <Clock className="w-3.5 h-3.5 text-amber-500" />;
  if (s === "locked") return <Lock className="w-3.5 h-3.5 text-slate-400" />;
  return <Circle className="w-3.5 h-3.5 text-slate-400" />;
}
