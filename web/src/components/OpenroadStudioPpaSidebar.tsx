"use client";

import {
  ActivityTimeline,
  ClockWaveform,
  MetricTiles,
  SlackHistogram,
  StackedBars,
} from "@/components/OpenroadCharts";
import type { FlowMetrics, VcdActivityBin } from "@/lib/openroad-flow-model";
import { FLOW_CONFIG_NAME } from "@/lib/openroad-template";

export type OpenroadStudioPpaSidebarProps = {
  hasRealMetrics: boolean;
  metricsCsv: boolean;
  metrics: FlowMetrics;
  jobId?: string;
  artifactNames?: string[];
  onLoadPlacementReports: (jobId: string, names?: string[]) => void;
  clockView: {
    periodNs?: number;
    riseNs?: number;
    fallNs?: number;
    name?: string;
    source?: "sdc" | "stage_input" | null;
  } | null;
  hasRtl: boolean;
  activityBins?: VcdActivityBin[];
  activityPower?: { t: number; powerMw: number }[];
  activityMeta?: {
    signalCount?: number;
    totalToggles?: number;
    timescaleHint?: string;
  };
};

export function OpenroadStudioPpaSidebar({
  hasRealMetrics,
  metricsCsv,
  metrics,
  jobId,
  artifactNames,
  onLoadPlacementReports,
  clockView,
  hasRtl,
  activityBins,
  activityPower,
  activityMeta,
}: OpenroadStudioPpaSidebarProps) {
  return (
    <aside className="neu-panel overflow-y-auto p-3 space-y-4">
      <p className="text-[9px] font-black uppercase text-[var(--neu-text-muted)]">
        Stage metrics (reports only)
      </p>
      {!hasRealMetrics && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-[var(--neu-text-muted)]">
            Empty until curated reports arrive (placement_timing.rpt / power /
            area / metrics.csv). No mid-run log guessing.
          </p>
          {jobId && (
            <button
              type="button"
              className="neu-btn neu-btn-primary !text-[9px] font-black w-full"
              onClick={() => onLoadPlacementReports(jobId, artifactNames)}
            >
              Load PPA from placement reports
            </button>
          )}
        </div>
      )}
      {hasRealMetrics && (
        <p className="text-[9px] font-bold text-emerald-700">
          From finalized reports
          {metricsCsv ? " + metrics.csv" : ""}
          {metrics.wnsNs === 0 && metrics.tnsNs === 0
            ? " · WNS/TNS 0 = no violations"
            : ""}
        </p>
      )}
      <MetricTiles metrics={metrics} />
      {metrics.areaBreakdown.length > 0 && (
        <StackedBars title="Area (from metrics)" items={metrics.areaBreakdown} />
      )}
      {metrics.powerBreakdown.length > 0 && (
        <StackedBars
          title="Power (from report)"
          items={metrics.powerBreakdown}
        />
      )}
      <ActivityTimeline
        bins={activityBins || []}
        powerSeries={activityPower}
        signalCount={activityMeta?.signalCount}
        totalToggles={activityMeta?.totalToggles}
        timescaleHint={activityMeta?.timescaleHint}
      />
      {metrics.slackHistogram.length > 0 && (
        <SlackHistogram data={metrics.slackHistogram} />
      )}
      <ClockWaveform
        periodNs={clockView?.periodNs}
        riseNs={clockView?.riseNs}
        fallNs={clockView?.fallNs}
        clockName={clockView?.name}
        source={clockView?.source ?? null}
      />
      <div className="text-[9px] font-bold text-[var(--neu-text-muted)] leading-relaxed border-t border-slate-200 pt-2 space-y-1">
        <p>
          <strong>Views:</strong> Lint = summary · Sim = VCD wave · Synth =
          netlist stats · IO Planner = port sides · Floorplan+ = die · GDS =
          signoff
        </p>
        <p>
          Order only — complete prior stages before Run. Config dual-writes to{" "}
          {FLOW_CONFIG_NAME}.
        </p>
        {!hasRtl && (
          <p className="text-amber-600">
            Project missing RTL — download template on Project page.
          </p>
        )}
      </div>
    </aside>
  );
}
