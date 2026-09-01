export type GvimMode = "normal" | "insert" | "cmdline" | "search";

export type GvimState = {
  lines: string[];
  row: number;
  col: number;
  mode: GvimMode;
  cmd: string;
  yank: string;
  message: string;
  lastSearch: string;
};

export const GVIM_TEMPLATE = `module alu (
  input  wire clk,
  input  wire rst_n,
  input  wire [7:0] a,
  input  wire [7:0] b,
  output reg  [7:0] y
);
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) y <= 8'h00;
    else        y <= a + b; // TODO: clk_core domain
  end
endmodule
# slack (VIOLATED) -0.42 ns  endpoint u_alu/y_reg[7]/D
# slack (MET)      0.18 ns  endpoint u_alu/y_reg[0]/D
`;

export function initialGvim(template = GVIM_TEMPLATE): GvimState {
  return {
    lines: template.replace(/\n$/, "").split("\n"),
    row: 0,
    col: 0,
    mode: "normal",
    cmd: "",
    yank: "",
    message: "-- NORMAL --  try: /TODO  then  :%s/clk_core/clk_sys/g",
    lastSearch: "",
  };
}

function clamp(s: GvimState): GvimState {
  const row = Math.max(0, Math.min(s.row, s.lines.length - 1));
  const col = Math.max(0, Math.min(s.col, (s.lines[row] || "").length));
  return { ...s, row, col };
}

function findIn(s: GvimState, pat: string, fromRow: number, fromCol: number, wrap = true): { row: number; col: number } | null {
  if (!pat) return null;
  for (let r = fromRow; r < s.lines.length; r++) {
    const start = r === fromRow ? fromCol : 0;
    const idx = s.lines[r].indexOf(pat, start);
    if (idx >= 0) return { row: r, col: idx };
  }
  if (wrap) {
    for (let r = 0; r <= fromRow; r++) {
      const idx = s.lines[r].indexOf(pat, 0);
      if (idx >= 0) return { row: r, col: idx };
    }
  }
  return null;
}

export function gvimKey(s: GvimState, key: string, ctrl = false): GvimState {
  s = clamp(s);

  if (s.mode === "insert") {
    if (key === "Escape") return { ...s, mode: "normal", message: "-- NORMAL --" };
    if (key === "Backspace") {
      if (s.col === 0) return s;
      const line = s.lines[s.row];
      const lines = [...s.lines];
      lines[s.row] = line.slice(0, s.col - 1) + line.slice(s.col);
      return { ...s, lines, col: s.col - 1 };
    }
    if (key === "Enter") {
      const line = s.lines[s.row];
      const lines = [...s.lines];
      lines.splice(s.row, 1, line.slice(0, s.col), line.slice(s.col));
      return { ...s, lines, row: s.row + 1, col: 0 };
    }
    if (key.length === 1) {
      const line = s.lines[s.row];
      const lines = [...s.lines];
      lines[s.row] = line.slice(0, s.col) + key + line.slice(s.col);
      return { ...s, lines, col: s.col + 1 };
    }
    return s;
  }

  if (s.mode === "search" || s.mode === "cmdline") {
    if (key === "Escape") return { ...s, mode: "normal", cmd: "", message: "-- NORMAL --" };
    if (key === "Backspace") return { ...s, cmd: s.cmd.slice(0, -1) };
    if (key === "Enter") {
      if (s.mode === "search") {
        const hit = findIn(s, s.cmd, s.row, s.col + 1);
        return clamp({
          ...s,
          mode: "normal",
          lastSearch: s.cmd,
          row: hit?.row ?? s.row,
          col: hit?.col ?? s.col,
          message: hit ? `/${s.cmd}` : `E486: Pattern not found: ${s.cmd}`,
          cmd: "",
        });
      }
      return runEx(s, s.cmd);
    }
    if (key.length === 1) return { ...s, cmd: s.cmd + key };
    return s;
  }

  // normal
  if (key === "i") return { ...s, mode: "insert", message: "-- INSERT --" };
  if (key === "a") return { ...s, mode: "insert", col: s.col + 1, message: "-- INSERT --" };
  if (key === "o") {
    const lines = [...s.lines];
    lines.splice(s.row + 1, 0, "");
    return { ...s, lines, row: s.row + 1, col: 0, mode: "insert", message: "-- INSERT --" };
  }
  if (key === "h" || key === "ArrowLeft") return clamp({ ...s, col: s.col - 1 });
  if (key === "l" || key === "ArrowRight") return clamp({ ...s, col: s.col + 1 });
  if (key === "j" || key === "ArrowDown") return clamp({ ...s, row: s.row + 1 });
  if (key === "k" || key === "ArrowUp") return clamp({ ...s, row: s.row - 1 });
  if (key === "0") return { ...s, col: 0 };
  if (key === "$") return { ...s, col: s.lines[s.row].length };
  if (key === "g") return { ...s, row: 0, col: 0, message: "gg" };
  if (key === "G") return { ...s, row: s.lines.length - 1, col: 0 };
  if (key === "x") {
    const line = s.lines[s.row];
    const lines = [...s.lines];
    lines[s.row] = line.slice(0, s.col) + line.slice(s.col + 1);
    return { ...s, lines };
  }
  if (key === "d") {
    const lines = [...s.lines];
    const yank = lines[s.row];
    if (lines.length === 1) lines[0] = "";
    else lines.splice(s.row, 1);
    return clamp({ ...s, lines, yank, message: "dd" });
  }
  if (key === "y") return { ...s, yank: s.lines[s.row], message: "yy" };
  if (key === "p") {
    const lines = [...s.lines];
    lines.splice(s.row + 1, 0, s.yank || "");
    return { ...s, lines, row: s.row + 1 };
  }
  if (key === "u") return { ...s, message: "already at oldest change (single-level demo)" };
  if (key === "/") return { ...s, mode: "search", cmd: "", message: "/" };
  if (key === ":") return { ...s, mode: "cmdline", cmd: "", message: ":" };
  if (key === "n" && s.lastSearch) {
    const hit = findIn(s, s.lastSearch, s.row, s.col + 1);
    return clamp({ ...s, row: hit?.row ?? s.row, col: hit?.col ?? s.col, message: hit ? "n" : "search hit BOTTOM" });
  }
  if (ctrl && key === "w") return { ...s, message: "Ctrl-w w (split nav) — one buffer in this lab" };
  return s;
}

function runEx(s: GvimState, cmd: string): GvimState {
  const c = cmd.replace(/^\s*/, "");
  if (c === "q" || c === "q!" || c === "wq" || c === "w") {
    return { ...s, mode: "normal", cmd: "", message: `:${c}  (sandbox — buffer kept)` };
  }
  if (c === "set nu" || c === "set number") return { ...s, mode: "normal", cmd: "", message: ":set nu  (line numbers on)" };
  const m = c.match(/^%s\/([^/]+)\/([^/]*)\/([gci]*)$/);
  if (m) {
    const [, old, neu, flags] = m;
    const g = flags.includes("g");
    const lines = s.lines.map((ln) => (g ? ln.split(old).join(neu) : ln.replace(old, neu)));
    const n = s.lines.filter((ln, i) => ln !== lines[i]).length;
    return { ...s, lines, mode: "normal", cmd: "", message: `${n} line(s) changed` };
  }
  const gdel = c.match(/^g\/([^/]+)\/d$/);
  if (gdel) {
    const lines = s.lines.filter((ln) => !ln.includes(gdel[1]));
    return { ...s, lines, row: 0, col: 0, mode: "normal", cmd: "", message: `:g/${gdel[1]}/d` };
  }
  return { ...s, mode: "normal", cmd: "", message: `E492: Not an editor command: ${c}` };
}
