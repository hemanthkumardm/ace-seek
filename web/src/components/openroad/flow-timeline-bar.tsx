"use client";

import React from "react";
import type { FlowStageId } from "@/lib/openroad-flow-model";
import { FLOW_STAGES } from "@/lib/openroad-flow-model";

interface FlowTimelineBarProps {
  selectedStage: FlowStageId;
  runningStage: FlowStageId | null;
  completedStages: FlowStageId[];
  onSelectStage: (stage: FlowStageId) => void;
  onRunStage: (stage: FlowStageId) => void;
  disabled?: boolean;
}

export function FlowTimelineBar({
  selectedStage,
  runningStage,
  completedStages,
  onSelectStage,
  onRunStage,
  disabled = false,
}: FlowTimelineBarProps) {
  return (
    <div className="w-full bg-[#0b0f19] border border-white/10 rounded-xl p-3 flex items-center gap-2 overflow-x-auto shadow-inner">
      {FLOW_STAGES.map((stage, idx) => {
        const isSelected = selectedStage === stage.id;
        const isRunning = runningStage === stage.id;
        const isDone = completedStages.includes(stage.id);

        return (
          <React.Fragment key={stage.id}>
            {idx > 0 && (
              <div
                className={`h-[2px] w-6 shrink-0 transition-colors ${
                  isDone ? "bg-emerald-500/60" : "bg-white/10"
                }`}
              />
            )}

            <div
              onClick={() => onSelectStage(stage.id)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all shrink-0 border ${
                isSelected
                  ? "bg-blue-600/20 border-blue-500/50 text-white shadow-lg shadow-blue-500/10"
                  : isDone
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/30"
                    : isRunning
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-300 animate-pulse"
                      : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {/* Status indicator dot */}
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isRunning
                    ? "bg-amber-400 animate-ping"
                    : isDone
                      ? "bg-emerald-400"
                      : isSelected
                        ? "bg-blue-400"
                        : "bg-white/20"
                }`}
              />

              <span className="text-xs font-semibold tracking-wide">
                {stage.label}
              </span>

              {/* Mini run trigger button */}
              {!isRunning && (
                <button
                  type="button"
                  title={`Run ${stage.label}`}
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunStage(stage.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 ml-1 p-1 hover:bg-white/20 rounded text-[10px] text-white/80 transition-opacity"
                >
                  ▶
                </button>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
