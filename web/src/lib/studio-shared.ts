/**
 * Cross-studio shared storage keys and helpers (Timing ↔ SDC).
 * Browser-only; safe no-ops on server.
 */

const KEYS = {
  lastSdcJson: "ace-seek.vlsi.lastSdcState",
  lastDesignName: "ace-seek.vlsi.lastDesignName",
  lastTimingVendor: "ace-seek.vlsi.lastTimingVendor",
} as const;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function saveLastDesignName(name: string): void {
  if (!canUseStorage() || !name.trim()) return;
  try {
    localStorage.setItem(KEYS.lastDesignName, name.trim());
  } catch {
    /* ignore quota */
  }
}

export function loadLastDesignName(): string {
  if (!canUseStorage()) return "";
  try {
    return localStorage.getItem(KEYS.lastDesignName) || "";
  } catch {
    return "";
  }
}

export function saveLastSdcStateJson(json: string): void {
  if (!canUseStorage()) return;
  try {
    // Cap size ~1.5MB
    if (json.length > 1_500_000) return;
    localStorage.setItem(KEYS.lastSdcJson, json);
  } catch {
    /* ignore */
  }
}

export function loadLastSdcStateJson(): string | null {
  if (!canUseStorage()) return null;
  try {
    return localStorage.getItem(KEYS.lastSdcJson);
  } catch {
    return null;
  }
}

export function clearLastSdcState(): void {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(KEYS.lastSdcJson);
  } catch {
    /* ignore */
  }
}

/** Prefer report design name, then override, then filename stem, then last saved. */
export function resolveDisplayDesignName(opts: {
  reportDesignName?: string;
  userOverride?: string;
  filename?: string;
}): string {
  if (opts.userOverride?.trim()) return opts.userOverride.trim();
  if (opts.reportDesignName?.trim()) return opts.reportDesignName.trim();
  if (opts.filename?.trim()) {
    const base = opts.filename.replace(/\.(rpt|txt|log|gz|timing)$/i, "");
    if (base && base !== opts.filename) return base;
    if (base) return base;
  }
  const last = loadLastDesignName();
  return last || "";
}
