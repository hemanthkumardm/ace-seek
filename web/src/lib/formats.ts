/** Document formats supported by Doc Compiler (round-trip converter). */

export type DocFormat =
  | "md"
  | "tex"
  | "docx"
  | "pdf"
  | "html"
  | "odt"
  | "plain"
  | "rst";

export type FormatMeta = {
  id: DocFormat;
  label: string;
  ext: string;
  /** Editable in the text panel (vs file-only) */
  textEditable: boolean;
  mime: string;
  /** Accept attribute for file inputs */
  accept: string;
  /** Pandoc -f / -t name (null for special handling) */
  pandoc: string | null;
};

export const FORMAT_META: Record<DocFormat, FormatMeta> = {
  md: {
    id: "md",
    label: "Markdown",
    ext: "md",
    textEditable: true,
    mime: "text/markdown",
    accept: ".md,.markdown,.txt",
    pandoc: "markdown",
  },
  tex: {
    id: "tex",
    label: "LaTeX / TeX",
    ext: "tex",
    textEditable: true,
    mime: "application/x-tex",
    accept: ".tex,.latex",
    pandoc: "latex",
  },
  docx: {
    id: "docx",
    label: "Word (DOCX)",
    ext: "docx",
    textEditable: false,
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    accept: ".docx",
    pandoc: "docx",
  },
  pdf: {
    id: "pdf",
    label: "PDF",
    ext: "pdf",
    textEditable: false,
    mime: "application/pdf",
    accept: ".pdf",
    pandoc: null, // special: out via TeX engine, in via pdftotext
  },
  html: {
    id: "html",
    label: "HTML",
    ext: "html",
    textEditable: true,
    mime: "text/html",
    accept: ".html,.htm",
    pandoc: "html",
  },
  odt: {
    id: "odt",
    label: "OpenDocument (ODT)",
    ext: "odt",
    textEditable: false,
    mime: "application/vnd.oasis.opendocument.text",
    accept: ".odt",
    pandoc: "odt",
  },
  plain: {
    id: "plain",
    label: "Plain text",
    ext: "txt",
    textEditable: true,
    mime: "text/plain",
    accept: ".txt",
    // Pandoc: "plain" is a *writer* only. Readers use markdown (plain-ish).
    pandoc: "markdown",
  },
  rst: {
    id: "rst",
    label: "reStructuredText",
    ext: "rst",
    textEditable: true,
    mime: "text/x-rst",
    accept: ".rst",
    pandoc: "rst",
  },
};

export const INPUT_FORMATS: DocFormat[] = [
  "md",
  "tex",
  "docx",
  "pdf",
  "html",
  "odt",
  "plain",
  "rst",
];

export const OUTPUT_FORMATS: DocFormat[] = [
  "pdf",
  "md",
  "tex",
  "docx",
  "html",
  "odt",
  "plain",
];

export function isDocFormat(s: string): s is DocFormat {
  return s in FORMAT_META;
}

/** Whether this pair is supported (best-effort for PDF → *). */
export function canConvert(from: DocFormat, to: DocFormat): boolean {
  if (from === to) return true;
  // PDF output always possible via pandoc/aic for non-pdf inputs
  if (to === "pdf") return true;
  // PDF input: extract text then re-encode
  if (from === "pdf") return true;
  // All other pairs via pandoc
  return true;
}

/** PDF → DOCX dual mode */
export type PdfDocxMode = "editable" | "exact";

export function qualityNote(
  from: DocFormat,
  to: DocFormat,
  pdfDocxMode?: PdfDocxMode
): string | null {
  if (from === to) return "Same format — file will be copied / normalized.";
  if (from === "pdf" && to === "docx") {
    if (pdfDocxMode === "exact") {
      return "Exact MAX: full-page lossless PNG per page (Pro: 300–400 DPI) — near-identical look, not text-editable.";
    }
    return "Editable MAX: pdf2docx multi-core layout parse — text/tables editable; geometry approximate.";
  }
  if (from === "pdf" && (to === "md" || to === "plain")) {
    return "PDF → text extracts readable content (not a perfect layout reverse).";
  }
  if (from === "pdf" && to !== "docx") {
    return "PDF → this format uses text extraction (layout may be imperfect). Prefer PDF → DOCX dual mode for layout.";
  }
  if (to === "pdf" && from !== "md" && from !== "tex") {
    return "Non-Markdown → PDF uses Pandoc + TeX engine (complex layouts vary).";
  }
  if (from === "md" && to === "pdf") {
    return "Full pipeline: preprocess Tcl/SDC + Pandoc + TeX (best quality).";
  }
  return null;
}

/**
 * Pandoc -f (reader). "plain" is not a valid input format in Pandoc.
 */
export function pandocReader(format: DocFormat): string | null {
  if (format === "pdf") return null;
  if (format === "plain") return "markdown";
  return FORMAT_META[format].pandoc;
}

/**
 * Pandoc -t (writer). Plain text output uses the "plain" writer.
 */
export function pandocWriter(format: DocFormat): string | null {
  if (format === "pdf") return null;
  if (format === "plain") return "plain";
  return FORMAT_META[format].pandoc;
}

export function detectFormatFromName(name: string): DocFormat | null {
  const lower = name.toLowerCase();
  const ext = lower.includes(".") ? lower.split(".").pop()! : "";
  const map: Record<string, DocFormat> = {
    md: "md",
    markdown: "md",
    tex: "tex",
    latex: "tex",
    docx: "docx",
    pdf: "pdf",
    html: "html",
    htm: "html",
    odt: "odt",
    txt: "plain",
    rst: "rst",
  };
  return map[ext] || null;
}
