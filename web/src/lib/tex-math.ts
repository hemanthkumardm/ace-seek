/**
 * LaTeX math helpers: templates, normalize, wrap formats.
 */

export type MathWrapMode =
  | "display-dollar"
  | "inline-dollar"
  | "display-paren"
  | "inline-paren"
  | "raw"
  | "align";

export type MathTemplate = {
  name: string;
  tex: string;
  category: string;
};

export const MATH_TEMPLATES: MathTemplate[] = [
  // Algebra
  { category: "Algebra", name: "Quadratic", tex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" },
  { category: "Algebra", name: "Einstein", tex: "E = mc^2" },
  { category: "Algebra", name: "Binomial", tex: "(a + b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k" },
  { category: "Algebra", name: "Log laws", tex: "\\log(ab) = \\log a + \\log b" },
  // Calculus
  { category: "Calculus", name: "Derivative", tex: "\\frac{d}{dx}f(x) = \\lim_{h \\to 0}\\frac{f(x+h)-f(x)}{h}" },
  { category: "Calculus", name: "Integral", tex: "\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)" },
  { category: "Calculus", name: "Partial", tex: "\\frac{\\partial f}{\\partial x}" },
  { category: "Calculus", name: "Gradient", tex: "\\nabla f = \\left(\\frac{\\partial f}{\\partial x},\\frac{\\partial f}{\\partial y}\\right)" },
  // Series
  { category: "Series", name: "Sum", tex: "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}" },
  { category: "Series", name: "Product", tex: "\\prod_{i=1}^{n} i = n!" },
  { category: "Series", name: "Limit", tex: "\\lim_{x \\to \\infty} \\frac{1}{x} = 0" },
  // Linear algebra
  { category: "Matrix", name: "2×2 matrix", tex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
  { category: "Matrix", name: "Determinant", tex: "\\det(A) = ad - bc" },
  { category: "Matrix", name: "Dot product", tex: "\\mathbf{a}\\cdot\\mathbf{b} = |\\mathbf{a}||\\mathbf{b}|\\cos\\theta" },
  // STA / VLSI
  { category: "STA / VLSI", name: "Setup slack", tex: "T_{clk} \\ge t_{cq} + t_{pd} + t_{su}" },
  { category: "STA / VLSI", name: "Hold check", tex: "t_{cq,min} + t_{pd,min} \\ge t_{h}" },
  { category: "STA / VLSI", name: "Skew budget", tex: "T_{setup} = T_{clk} - t_{su} - t_{cq} - t_{skew}" },
  { category: "STA / VLSI", name: "Uncertainty", tex: "t_{unc} = k \\cdot T_{clk}" },
  { category: "STA / VLSI", name: "Period from f", tex: "T = \\frac{1}{f}" },
  { category: "STA / VLSI", name: "Duty cycle", tex: "D = \\frac{t_{high}}{T_{clk}}" },
  // Probability
  { category: "Stats", name: "Normal PDF", tex: "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}" },
  { category: "Stats", name: "Expectation", tex: "\\mathbb{E}[X] = \\sum_{i} x_i p_i" },
];

export type SymbolChip = { label: string; insert: string; title?: string };

export const SYMBOL_CHIPS: { group: string; items: SymbolChip[] }[] = [
  {
    group: "Structure",
    items: [
      { label: "a/b", insert: "\\frac{a}{b}", title: "Fraction" },
      { label: "√", insert: "\\sqrt{x}", title: "Square root" },
      { label: "ⁿ√", insert: "\\sqrt[n]{x}", title: "Nth root" },
      { label: "x²", insert: "x^{2}", title: "Superscript" },
      { label: "xᵢ", insert: "x_{i}", title: "Subscript" },
      { label: "( )", insert: "\\left( \\right)", title: "Auto-sized parens" },
      { label: "[ ]", insert: "\\left[ \\right]", title: "Auto-sized brackets" },
    ],
  },
  {
    group: "Ops",
    items: [
      { label: "±", insert: "\\pm" },
      { label: "×", insert: "\\times" },
      { label: "÷", insert: "\\div" },
      { label: "·", insert: "\\cdot" },
      { label: "≠", insert: "\\neq" },
      { label: "≤", insert: "\\le" },
      { label: "≥", insert: "\\ge" },
      { label: "≈", insert: "\\approx" },
      { label: "→", insert: "\\to" },
      { label: "⇒", insert: "\\Rightarrow" },
      { label: "∞", insert: "\\infty" },
      { label: "∈", insert: "\\in" },
    ],
  },
  {
    group: "Calc",
    items: [
      { label: "∑", insert: "\\sum_{i=1}^{n}" },
      { label: "∏", insert: "\\prod_{i=1}^{n}" },
      { label: "∫", insert: "\\int_{a}^{b}" },
      { label: "∮", insert: "\\oint" },
      { label: "∂", insert: "\\partial" },
      { label: "∇", insert: "\\nabla" },
      { label: "lim", insert: "\\lim_{x \\to 0}" },
    ],
  },
  {
    group: "Greek",
    items: [
      { label: "α", insert: "\\alpha" },
      { label: "β", insert: "\\beta" },
      { label: "γ", insert: "\\gamma" },
      { label: "δ", insert: "\\delta" },
      { label: "ε", insert: "\\varepsilon" },
      { label: "θ", insert: "\\theta" },
      { label: "λ", insert: "\\lambda" },
      { label: "μ", insert: "\\mu" },
      { label: "π", insert: "\\pi" },
      { label: "σ", insert: "\\sigma" },
      { label: "τ", insert: "\\tau" },
      { label: "φ", insert: "\\phi" },
      { label: "ω", insert: "\\omega" },
      { label: "Δ", insert: "\\Delta" },
      { label: "Ω", insert: "\\Omega" },
      { label: "Σ", insert: "\\Sigma" },
    ],
  },
];

export const WRAP_MODES: { id: MathWrapMode; label: string; hint: string }[] = [
  { id: "display-dollar", label: "Display $$", hint: "Markdown / Pandoc display math" },
  { id: "inline-dollar", label: "Inline $", hint: "Markdown inline math" },
  { id: "display-paren", label: "Display \\[ \\]", hint: "LaTeX display" },
  { id: "inline-paren", label: "Inline \\( \\)", hint: "LaTeX inline" },
  { id: "align", label: "align*", hint: "Multi-line equation environment" },
  { id: "raw", label: "Raw TeX", hint: "Expression only, no delimiters" },
];

/** Strip common wrappers and tidy expression */
export function normalizeTex(input: string): string {
  let s = input.trim();
  // Remove outer $$ ... $$
  s = s.replace(/^\$\$\s*([\s\S]*?)\s*\$\$$/m, "$1");
  // Remove outer $ ... $ (single line-ish)
  s = s.replace(/^\$\s*([\s\S]*?)\s*\$$/m, "$1");
  // \( \) and \[ \]
  s = s.replace(/^\\\(\s*([\s\S]*?)\s*\\\)$/m, "$1");
  s = s.replace(/^\\\[\s*([\s\S]*?)\s*\\\]$/m, "$1");
  // begin{equation} / align wrappers (simple)
  s = s.replace(/\\begin\{(?:equation\*?|align\*?|displaymath)\}/g, "");
  s = s.replace(/\\end\{(?:equation\*?|align\*?|displaymath)\}/g, "");
  // Collapse excessive blank lines
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  // Normalize ≥ ≤ if pasted as unicode (common in docs)
  s = s
    .replace(/≥/g, "\\ge ")
    .replace(/≤/g, "\\le ")
    .replace(/≠/g, "\\neq ")
    .replace(/×/g, "\\times ")
    .replace(/·/g, "\\cdot ")
    .replace(/∞/g, "\\infty ")
    .replace(/→/g, "\\to ")
    .replace(/α/g, "\\alpha ")
    .replace(/β/g, "\\beta ")
    .replace(/γ/g, "\\gamma ")
    .replace(/θ/g, "\\theta ")
    .replace(/λ/g, "\\lambda ")
    .replace(/μ/g, "\\mu ")
    .replace(/π/g, "\\pi ")
    .replace(/σ/g, "\\sigma ")
    .replace(/τ/g, "\\tau ")
    .replace(/φ/g, "\\phi ")
    .replace(/ω/g, "\\omega ")
    .replace(/Δ/g, "\\Delta ")
    .replace(/Ω/g, "\\Omega ");
  // Tidy double spaces from replacements
  s = s.replace(/[ \t]{2,}/g, " ").replace(/ +\n/g, "\n");
  return s.trim();
}

export function wrapTex(tex: string, mode: MathWrapMode): string {
  const body = tex.trim();
  switch (mode) {
    case "display-dollar":
      return `$$\n${body}\n$$`;
    case "inline-dollar":
      return `$${body}$`;
    case "display-paren":
      return `\\[\n${body}\n\\]`;
    case "inline-paren":
      return `\\(${body}\\)`;
    case "align":
      // If user didn't use &, put whole line on one align row
      if (body.includes("&") || body.includes("\\\\")) {
        return `\\begin{align*}\n${body}\n\\end{align*}`;
      }
      return `\\begin{align*}\n${body}\n\\end{align*}`;
    case "raw":
    default:
      return body;
  }
}

export function templateCategories(): string[] {
  const set = new Set(MATH_TEMPLATES.map((t) => t.category));
  return Array.from(set);
}
