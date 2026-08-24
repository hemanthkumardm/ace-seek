"use client";

import { OpenroadStatusIcon } from "@/components/OpenroadStatusIcon";
import { FLOW_STAGES, type FlowStageId, type StageStatusUi } from "@/lib/openroad-flow-model";
import type { SanityItem } from "@/lib/openroad-stage-config";

export type StageRailEntry = {
  status: StageStatusUi;
  progress: number;
};

export type OpenroadStudioStageRailProps = {
  selectedStage: FlowStageId;
  stages: StageRailEntry[];
  sanity: SanityItem[];
  onSelect: (id: FlowStageId) => void;
};

export function OpenroadStudioStageRail({
  selectedStage,
  stages,
  sanity,
  onSelect,
}: OpenroadStudioStageRailProps) {
  return (
    <aside className="neu-panel overflow-y-auto p-2 space-y-1">
      <p className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--neu-text-muted)]">
        Stages · order only
      </p>
      {FLOW_STAGES.map((s, idx) => {
        const st = stages[idx] || { status: "idle" as StageStatusUi, progress: 0 };
        const active = selectedStage === s.id;
        const sc = sanity.filter(
          (i) => i.stage === s.id && i.level === "error"
        ).length;
        const locked = st.status === "locked";
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`w-full text-left px-2 py-2 rounded-xl flex gap-2 items-start transition-all ${
              active
                ? "neu-btn-active text-sky-700"
                : locked
                  ? "opacity-60 hover:bg-white/30"
                  : "hover:bg-white/40"
            }`}
          >
            <OpenroadStatusIcon s={st.status} />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-1">
                <span className="text-[11px] font-black uppercase">
                  {idx + 1}. {s.short}
                </span>
                {sc > 0 && (
                  <span className="text-[9px] text-rose-500 font-black">!</span>
                )}
              </div>
              <p className="text-[9px] text-[var(--neu-text-muted)] font-bold">
                {s.label}
                {locked ? " · locked" : ""}
              </p>
              {st.status === "running" && (
                <div className="mt-1 h-1 neu-inset overflow-hidden">
                  <div
                    className="h-full bg-sky-500"
                    style={{ width: `${st.progress}%` }}
                  />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </aside>
  );
}
