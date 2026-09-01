/**
 * Client helpers for cloud SDC projects (calls /api/projects/sdc).
 * No-ops gracefully when not signed in or cloud storage is unavailable.
 */

import type { SdcStudioState } from "@/lib/sdc-engine";
import type { VendorFormat, SdcToolTarget } from "@/lib/sdc-engine";

export type SdcProjectRow = {
  id: string;
  name: string;
  design_name: string | null;
  vendor: string | null;
  tool: string | null;
  state_json: SdcStudioState;
  is_active: boolean;
  updated_at: string;
  created_at: string;
};

export type SaveSdcProjectInput = {
  id?: string;
  name?: string;
  designName?: string;
  vendor?: VendorFormat | string;
  tool?: SdcToolTarget | string;
  state: SdcStudioState;
  setActive?: boolean;
};

export async function fetchActiveSdcProject(): Promise<SdcProjectRow | null> {
  try {
    const res = await fetch("/api/projects/sdc?active=1", {
      credentials: "same-origin",
    });
    if (res.status === 401 || res.status === 503) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return (data.project as SdcProjectRow) || null;
  } catch {
    return null;
  }
}

export async function listSdcProjects(): Promise<SdcProjectRow[]> {
  try {
    const res = await fetch("/api/projects/sdc", { credentials: "same-origin" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.projects as SdcProjectRow[]) || [];
  } catch {
    return [];
  }
}

export async function saveSdcProject(
  input: SaveSdcProjectInput
): Promise<{ ok: true; project: SdcProjectRow } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/projects/sdc", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: input.id,
        name: input.name,
        designName: input.designName,
        vendor: input.vendor,
        tool: input.tool,
        state: input.state,
        setActive: input.setActive !== false,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || `Save failed (${res.status})` };
    }
    return { ok: true, project: data.project as SdcProjectRow };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Save failed",
    };
  }
}

export async function cloudProjectsAvailable(): Promise<boolean> {
  try {
    const res = await fetch("/api/projects/sdc?ping=1", {
      credentials: "same-origin",
    });
    // 401 = clerk not signed in but API exists; 503 = no supabase
    return res.status !== 503 && res.status !== 404;
  } catch {
    return false;
  }
}
