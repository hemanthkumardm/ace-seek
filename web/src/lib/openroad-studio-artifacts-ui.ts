/**
 * Studio Artifacts panel — kind sub-tabs + matcher (Sprint 2 extract).
 */

export type ArtifactKindTab =
  | "all"
  | "logs"
  | "reports"
  | "layout"
  | "metrics"
  | "vcd"
  | "other";

export function artifactMatchesKindTab(
  tab: ArtifactKindTab,
  kind: string,
  name: string
): boolean {
  const n = name;
  const isLog =
    kind === "log" || /\.log$|\.warnings$|\.errors$|logs_/i.test(n);
  const isMetrics =
    kind === "metrics" || /metrics\.csv|metrics_summary/i.test(n);
  const isLayout =
    kind === "def" || kind === "odb" || kind === "gds" || /\.def$|\.odb$|\.gds/i.test(n);
  const isVcd = kind === "vcd" || /\.vcd$/i.test(n);
  const isReport =
    kind === "report" ||
    kind === "summary" ||
    (/\.rpt$|report|summary|stat/i.test(n) && !isLog && !isMetrics);
  switch (tab) {
    case "all":
      return true;
    case "logs":
      return isLog;
    case "reports":
      return isReport;
    case "layout":
      return isLayout;
    case "metrics":
      return isMetrics;
    case "vcd":
      return isVcd;
    case "other":
      return !isLog && !isReport && !isLayout && !isMetrics && !isVcd;
    default:
      return true;
  }
}

export const ARTIFACT_KIND_TABS: { id: ArtifactKindTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "logs", label: "Logs" },
  { id: "reports", label: "Reports" },
  { id: "layout", label: "Layout" },
  { id: "metrics", label: "Metrics" },
  { id: "vcd", label: "VCD" },
  { id: "other", label: "Other" },
];

export type StudioBottomTab =
  | "log"
  | "inputs"
  | "sanity"
  | "reports"
  | "artifacts"
  | "flow";
