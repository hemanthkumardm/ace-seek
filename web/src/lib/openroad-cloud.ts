/**
 * OpenROAD cloud persistence via Supabase (service role API routes).
 * Client calls /api/openroad/cloud/* — falls back to localStorage when offline.
 *
 * Cloud holds a *studio session* snapshot only (project + stageInputs + progress).
 * Physical truth (DEF/GDS) lives in host flow checkpoints + job artifacts — not here.
 */

import type { OpenroadProjectState } from "./openroad-project-hub";
import type { FlowStageId, StageResultPayload } from "./openroad-flow-model";
import type { StageInputValues } from "./openroad-stage-config";
import type { StageArtifact } from "./openroad-stage-artifacts";

export interface OpenroadCloudState {
  project: OpenroadProjectState;
  stageInputs?: StageInputValues;
  completedStages?: FlowStageId[];
  stageResults?: Partial<Record<FlowStageId, StageResultPayload>>;
  flowConfig?: unknown;
}

export interface CloudProjectRow {
  id: string;
  name: string;
  design_name: string;
  top_module: string;
  pdk: string;
  state_json: OpenroadCloudState;
  flow_config_json: unknown;
  updated_at: string;
}

function apiKeyHeader(): HeadersInit {
  if (typeof window === "undefined") return {};
  const k =
    localStorage.getItem("ace_seek_api_key") ||
    localStorage.getItem("ace_api_key") ||
    "";
  return k ? { "x-api-key": k } : {};
}

/** Ping whether cloud backend is ready */
export async function cloudPing(): Promise<boolean> {
  try {
    const res = await fetch("/api/openroad/cloud/project?ping=1", {
      headers: { ...apiKeyHeader() },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function cloudLoadProject(): Promise<{
  ok: boolean;
  project?: CloudProjectRow | null;
  error?: string;
}> {
  try {
    const res = await fetch("/api/openroad/cloud/project?active=1", {
      headers: { ...apiKeyHeader() },
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || res.statusText };
    return { ok: true, project: data.project ?? null };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "cloud load failed",
    };
  }
}

export async function cloudSaveProject(
  state: OpenroadCloudState & { projectId?: string }
): Promise<{ ok: boolean; projectId?: string; error?: string }> {
  try {
    const res = await fetch("/api/openroad/cloud/project", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...apiKeyHeader(),
      },
      body: JSON.stringify({
        ...state,
        projectId: state.projectId || getLocalCloudProjectId() || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || res.statusText };
    return { ok: true, projectId: data.projectId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "cloud save failed",
    };
  }
}

export async function cloudListArtifacts(opts: {
  projectId?: string;
  stage?: FlowStageId;
}): Promise<{
  ok: boolean;
  artifacts?: StageArtifact[];
  error?: string;
}> {
  try {
    const q = new URLSearchParams();
    if (opts.projectId) q.set("projectId", opts.projectId);
    if (opts.stage) q.set("stage", opts.stage);
    const res = await fetch(`/api/openroad/cloud/artifacts?${q}`, {
      headers: { ...apiKeyHeader() },
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || res.statusText };
    return { ok: true, artifacts: data.artifacts || [] };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "list failed",
    };
  }
}

export async function cloudUploadArtifacts(
  projectId: string | undefined,
  artifacts: StageArtifact[]
): Promise<{ ok: boolean; error?: string }> {
  if (!artifacts.length) return { ok: true };
  try {
    const res = await fetch("/api/openroad/cloud/artifacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...apiKeyHeader(),
      },
      body: JSON.stringify({ projectId, artifacts }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || res.statusText };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "upload failed",
    };
  }
}

export async function cloudRecordStageRun(opts: {
  projectId?: string;
  stage: FlowStageId;
  status: "done" | "failed" | "running";
  summary?: string;
  result?: StageResultPayload;
}): Promise<void> {
  try {
    await fetch("/api/openroad/cloud/runs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...apiKeyHeader(),
      },
      body: JSON.stringify(opts),
    });
  } catch {
    /* best-effort */
  }
}

const CLOUD_PROJECT_ID_KEY = "ace_openroad_cloud_project_id";

export function getLocalCloudProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CLOUD_PROJECT_ID_KEY);
}

export function setLocalCloudProjectId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLOUD_PROJECT_ID_KEY, id);
}
