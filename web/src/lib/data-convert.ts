/**
 * Multi-format data & syntax conversions (client-side).
 */
import { load as yamlLoad, dump as yamlDump } from "js-yaml";
import { parse as tomlParse, stringify as tomlStringify } from "smol-toml";

export type DataFormat =
  | "json"
  | "yaml"
  | "toml"
  | "csv"
  | "base64"
  | "url"
  | "hex"
  | "text"
  | "query";

export type FormatInfo = {
  id: DataFormat;
  label: string;
  ext: string;
  sample: string;
  mono?: boolean;
};

export const DATA_FORMATS: FormatInfo[] = [
  {
    id: "json",
    label: "JSON",
    ext: "json",
    sample: `{
  "name": "Ace-Seek",
  "version": 2.6,
  "active": true,
  "tags": ["vlsi", "tools"]
}`,
  },
  {
    id: "yaml",
    label: "YAML",
    ext: "yaml",
    sample: `name: Ace-Seek
version: 2.6
active: true
tags:
  - vlsi
  - tools
`,
  },
  {
    id: "toml",
    label: "TOML",
    ext: "toml",
    sample: `name = "Ace-Seek"
version = 2.6
active = true
tags = ["vlsi", "tools"]
`,
  },
  {
    id: "csv",
    label: "CSV",
    ext: "csv",
    sample: `name,role,years
Alice,STA,5
Bob,PD,3
`,
  },
  {
    id: "base64",
    label: "Base64",
    ext: "b64",
    sample: "QWNlLVNlZWs=",
  },
  {
    id: "url",
    label: "URL-encoded",
    ext: "txt",
    sample: "hello%20world%26ace-seek",
  },
  {
    id: "hex",
    label: "Hex",
    ext: "hex",
    sample: "48656c6c6f",
  },
  {
    id: "query",
    label: "Query string",
    ext: "txt",
    sample: "name=Ace-Seek&version=2.6&active=true",
  },
  {
    id: "text",
    label: "Plain text",
    ext: "txt",
    sample: "Hello Ace-Seek",
  },
];

export function formatInfo(id: DataFormat): FormatInfo {
  return DATA_FORMATS.find((f) => f.id === id) || DATA_FORMATS[0];
}

/** Can we convert from → to? */
export function canConvertData(from: DataFormat, to: DataFormat): boolean {
  if (from === to) return true;
  // Structured data family
  const structured: DataFormat[] = ["json", "yaml", "toml", "csv", "query"];
  if (structured.includes(from) && structured.includes(to)) return true;
  // Text codecs
  const codecs: DataFormat[] = ["text", "base64", "url", "hex"];
  if (codecs.includes(from) && codecs.includes(to)) return true;
  // JSON/YAML object stringified to text codecs
  if (structured.includes(from) && codecs.includes(to)) return true;
  if (codecs.includes(from) && structured.includes(to) && from === "text") {
    // plain text only into structured if it's valid for that format
    return true;
  }
  if ((from === "base64" || from === "url" || from === "hex") && structured.includes(to)) {
    return true; // decode then parse
  }
  return false;
}

export type ConvertResult =
  | { ok: true; output: string; note?: string }
  | { ok: false; error: string };

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const clean = b64.replace(/\s+/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function toHex(str: string): string {
  return Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): string {
  const clean = hex.replace(/[\s:]/g, "");
  if (clean.length % 2 !== 0) throw new Error("Hex string length must be even");
  if (!/^[0-9a-fA-F]*$/.test(clean)) throw new Error("Invalid hex characters");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

/** Minimal CSV parse → array of records (objects) or arrays */
function parseCsv(text: string): unknown {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const rows = lines.map(parseCsvLine);
  const header = rows[0];
  // If first row looks like header (all non-empty strings), use objects
  if (header.every((c) => typeof c === "string" && c.length > 0) && rows.length > 1) {
    return rows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      header.forEach((h, i) => {
        obj[String(h)] = row[i] ?? "";
      });
      return obj;
    });
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function toCsv(data: unknown): string {
  if (!Array.isArray(data)) {
    if (data && typeof data === "object") {
      data = [data];
    } else {
      throw new Error("CSV output needs a JSON array of objects (or array of arrays)");
    }
  }
  const arr = data as unknown[];
  if (arr.length === 0) return "";

  // Array of arrays
  if (Array.isArray(arr[0])) {
    return (arr as string[][]).map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
  }

  // Array of objects — union of keys
  const keys: string[] = [];
  const keySet = new Set<string>();
  for (const row of arr) {
    if (row && typeof row === "object" && !Array.isArray(row)) {
      for (const k of Object.keys(row as object)) {
        if (!keySet.has(k)) {
          keySet.add(k);
          keys.push(k);
        }
      }
    }
  }
  if (keys.length === 0) throw new Error("CSV needs an array of objects with fields");

  const lines = [keys.map(csvEscape).join(",")];
  for (const row of arr) {
    const obj = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
    lines.push(keys.map((k) => csvEscape(obj[k])).join(","));
  }
  return lines.join("\n") + "\n";
}

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseQuery(qs: string): Record<string, string> {
  const clean = qs.replace(/^\?/, "");
  const params = new URLSearchParams(clean);
  const obj: Record<string, string> = {};
  params.forEach((v, k) => {
    obj[k] = v;
  });
  return obj;
}

function toQuery(data: unknown): string {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Query string needs a flat JSON object");
  }
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (v == null) continue;
    if (typeof v === "object") params.set(k, JSON.stringify(v));
    else params.set(k, String(v));
  }
  return params.toString();
}

/** Parse input string into a JS value for structured formats, or string for codecs */
function parseInput(from: DataFormat, input: string): unknown {
  const s = input.replace(/^\uFEFF/, "");
  switch (from) {
    case "json":
      return JSON.parse(s);
    case "yaml":
      return yamlLoad(s);
    case "toml":
      return tomlParse(s);
    case "csv":
      return parseCsv(s);
    case "query":
      return parseQuery(s);
    case "base64":
      return base64ToUtf8(s);
    case "url":
      return decodeURIComponent(s.replace(/\+/g, " "));
    case "hex":
      return fromHex(s);
    case "text":
      return s;
    default:
      throw new Error(`Unknown input format: ${from}`);
  }
}

function stringifyOutput(to: DataFormat, value: unknown, pretty: boolean): string {
  switch (to) {
    case "json":
      return JSON.stringify(value, null, pretty ? 2 : 0) + (pretty ? "\n" : "");
    case "yaml":
      return yamlDump(value, {
        lineWidth: 100,
        noRefs: true,
        sortKeys: false,
      });
    case "toml": {
      if (value == null || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("TOML needs an object at the root (not an array)");
      }
      return tomlStringify(value as Record<string, unknown>);
    }
    case "csv":
      return toCsv(value);
    case "query":
      return toQuery(value);
    case "base64":
      return utf8ToBase64(typeof value === "string" ? value : JSON.stringify(value, null, 2));
    case "url":
      return encodeURIComponent(typeof value === "string" ? value : JSON.stringify(value));
    case "hex":
      return toHex(typeof value === "string" ? value : JSON.stringify(value));
    case "text":
      return typeof value === "string" ? value : JSON.stringify(value, null, 2);
    default:
      throw new Error(`Unknown output format: ${to}`);
  }
}

/**
 * Convert between data formats.
 * Flow: parse `from` → intermediate JS value/string → stringify `to`.
 */
export function convertData(
  input: string,
  from: DataFormat,
  to: DataFormat,
  options?: { pretty?: boolean }
): ConvertResult {
  const pretty = options?.pretty !== false;
  try {
    if (!input.trim() && from !== "text") {
      return { ok: false, error: "Input is empty" };
    }
    if (from === to) {
      // Normalize pretty-print when same format for structured types
      if (from === "json" || from === "yaml" || from === "toml") {
        const v = parseInput(from, input);
        return { ok: true, output: stringifyOutput(to, v, pretty), note: "Normalized" };
      }
      return { ok: true, output: input };
    }

    if (!canConvertData(from, to)) {
      return {
        ok: false,
        error: `Cannot convert ${from.toUpperCase()} → ${to.toUpperCase()}`,
      };
    }

    let value = parseInput(from, input);

    const structured: DataFormat[] = ["json", "yaml", "toml", "csv", "query"];
    const codecs: DataFormat[] = ["base64", "url", "hex", "text"];

    // Codec → structured: decode to string, then parse as target (or JSON intermediate)
    if (codecs.includes(from) && structured.includes(to) && typeof value === "string") {
      const str = value.trim();
      try {
        if (to === "json") value = JSON.parse(str);
        else if (to === "yaml") value = yamlLoad(str);
        else if (to === "toml") value = tomlParse(str);
        else if (to === "csv") {
          // Prefer JSON array; else treat as CSV text
          try {
            value = JSON.parse(str);
          } catch {
            value = parseCsv(str);
          }
        } else if (to === "query") {
          try {
            value = JSON.parse(str);
          } catch {
            value = parseQuery(str);
          }
        }
      } catch {
        return {
          ok: false,
          error: `Decoded text is not valid ${to.toUpperCase()}.`,
        };
      }
    }

    // Structured → codecs: serialize then encode
    if (structured.includes(from) && codecs.includes(to)) {
      if (to === "text") {
        // Prefer native pretty form of source family
        const mid =
          from === "csv"
            ? stringifyOutput("json", value, pretty)
            : stringifyOutput(from, value, pretty);
        return { ok: true, output: mid };
      }
      const asText =
        typeof value === "string" ? value : JSON.stringify(value, null, pretty ? 2 : 0);
      return { ok: true, output: stringifyOutput(to, asText, pretty) };
    }

    const output = stringifyOutput(to, value, pretty);
    return { ok: true, output };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export function detectDataFormat(text: string): DataFormat | null {
  const t = text.trim();
  if (!t) return null;
  if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
    try {
      JSON.parse(t);
      return "json";
    } catch {
      /* fall through */
    }
  }
  if (t.includes("=") && !t.includes("\n") && t.includes("&")) return "query";
  if (/^[0-9a-fA-F\s:]+$/.test(t) && t.replace(/[\s:]/g, "").length % 2 === 0 && t.length > 8)
    return "hex";
  if (/^[A-Za-z0-9+/=\s]+$/.test(t) && t.length > 8 && !t.includes(" ")) {
    try {
      base64ToUtf8(t);
      return "base64";
    } catch {
      /* */
    }
  }
  if (t.includes(": ") || /^(---|#)/m.test(t)) return "yaml";
  if (/^[a-zA-Z0-9_.-]+\s*=/.test(t)) return "toml";
  if (t.includes(",") && t.includes("\n")) return "csv";
  return "text";
}
