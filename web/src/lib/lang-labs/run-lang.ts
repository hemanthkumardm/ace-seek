export type LabResult = { ok: true; stdout: string } | { ok: false; stdout: string; error: string };

function fail(msg: string, stdout = ""): LabResult {
  return { ok: false, stdout, error: msg };
}

/* ───────── Tcl teaching subset ───────── */

type TclEnv = {
  vars: Record<string, string>;
  procs: Record<string, { args: string[]; body: string }>;
  out: string[];
};

function tclSplitWords(s: string): string[] {
  const words: string[] = [];
  let i = 0;
  const n = s.length;
  const skipWs = () => {
    while (i < n && /[ \t]/.test(s[i])) i++;
  };
  while (i < n) {
    skipWs();
    if (i >= n) break;
    if (s[i] === "#") break;
    if (s[i] === "{") {
      let depth = 1;
      i++;
      const start = i;
      while (i < n && depth) {
        if (s[i] === "{") depth++;
        else if (s[i] === "}") depth--;
        if (depth) i++;
      }
      words.push("\x02" + s.slice(start, i));
      if (s[i] === "}") i++;
      continue;
    }
    if (s[i] === '"') {
      i++;
      let w = "";
      while (i < n && s[i] !== '"') {
        if (s[i] === "\\" && i + 1 < n) {
          w += s[i + 1];
          i += 2;
        } else {
          w += s[i++];
        }
      }
      if (s[i] === '"') i++;
      words.push(`\x01${w}`);
      continue;
    }
    let w = "";
    while (i < n && !/[ \t\n]/.test(s[i])) {
      if (s[i] === "[") {
        let depth = 1;
        w += s[i++];
        while (i < n && depth) {
          if (s[i] === "[") depth++;
          else if (s[i] === "]") depth--;
          w += s[i++];
        }
      } else w += s[i++];
    }
    words.push(w);
  }
  return words;
}

function tclSubst(env: TclEnv, word: string, literalBrace: boolean): string {
  if (literalBrace) return word;
  if (word.startsWith("\x01")) return tclInterpInner(env, word.slice(1));
  return tclInterpInner(env, word);
}

function tclInterpInner(env: TclEnv, s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "$") {
      i++;
      if (s[i] === "{") {
        i++;
        let name = "";
        while (i < s.length && s[i] !== "}") name += s[i++];
        out += env.vars[name] ?? "";
      } else {
        let name = "";
        while (i < s.length && /[A-Za-z0-9_]/.test(s[i])) name += s[i++];
        i--;
        out += env.vars[name] ?? "";
      }
    } else if (s[i] === "[") {
      let depth = 1;
      i++;
      let cmd = "";
      while (i < s.length && depth) {
        if (s[i] === "[") depth++;
        else if (s[i] === "]") depth--;
        if (depth) cmd += s[i];
        i++;
      }
      i--;
      out += tclEvalCommand(env, cmd);
    } else out += s[i];
  }
  return out;
}

function tclEvalExpr(expr: string): string {
  const sanitized = expr.replace(/[^0-9+\-*/%.()<>=!&| \t]/g, "");
  if (!sanitized.trim()) return "0";
  try {
    // eslint-disable-next-line no-new-func
    const v = Function(`"use strict"; return (${sanitized});`)();
    return String(v);
  } catch {
    throw new Error(`expr: bad expression '${expr}'`);
  }
}

function tclSplitCommands(script: string): string[] {
  const cmds: string[] = [];
  let cur = "";
  let depth = 0;
  let inQ = false;
  for (let i = 0; i < script.length; i++) {
    const ch = script[i];
    if (ch === '"' && depth === 0) inQ = !inQ;
    if (!inQ) {
      if (ch === "{") depth++;
      if (ch === "}") depth = Math.max(0, depth - 1);
      if ((ch === "\n" || ch === ";") && depth === 0) {
        const t = cur.trim();
        if (t && !t.startsWith("#")) cmds.push(t);
        cur = "";
        continue;
      }
    }
    cur += ch;
  }
  const t = cur.trim();
  if (t && !t.startsWith("#")) cmds.push(t);
  return cmds;
}

function tclEvalCommand(env: TclEnv, script: string): string {
  let last = "";
  for (const line of tclSplitCommands(script)) last = tclOne(env, line);
  return last;
}

function tclOne(env: TclEnv, line: string): string {
  const raw = tclSplitWords(line);
  if (!raw.length) return "";
  const isBrace = (w: string, idx: number) => {
    const orig = line;
    return orig.includes(`{${w}}`) && !raw[idx].startsWith("\x01");
  };
  const argv = raw.map((w, idx) => {
    if (w.startsWith("\x01")) return tclInterpInner(env, w.slice(1));
    const brace = line.includes("{" + w + "}") && !w.includes("$") === false;
    // Brace words from splitWords have braces stripped; detect by re-scan is hard.
    // Heuristic: if original token was braced, splitWords already returned inner without subst.
    // We mark braced by checking surrounding. Simpler: subst unless the word was from { }.
    return w;
  });
  // Re-do properly: splitWords returns inner of braces WITHOUT substitution.
  // Double-quoted words start with \x01 and need subst.
  // Bare words need subst.
  const words = raw.map((w) => {
    if (w.startsWith("\x02")) return w.slice(1); // { } literal
    if (w.startsWith("\x01")) return tclInterpInner(env, w.slice(1));
    if (/[$\[]/.test(w)) return tclInterpInner(env, w);
    return w;
  });
  const cmd = words[0];
  const args = words.slice(1);
  void isBrace;
  void argv;

  const proc = env.procs[cmd];
  if (proc) {
    const saved = { ...env.vars };
    proc.args.forEach((name, i) => {
      if (name === "args") env.vars.args = args.slice(i).join(" ");
      else env.vars[name] = args[i] ?? "";
    });
    const ret = tclEvalCommand(env, proc.body);
    env.vars = { ...saved, ...Object.fromEntries(Object.keys(saved).map((k) => [k, env.vars[k] ?? saved[k]])) };
    // restore but keep globals set via upvar-less set — teaching: proc locals discarded except we don't have locals.
    env.vars = saved;
    return ret;
  }

  switch (cmd) {
    case "set": {
      if (args.length === 1) return env.vars[args[0]] ?? "";
      env.vars[args[0]] = args.slice(1).join(" ");
      return env.vars[args[0]];
    }
    case "puts": {
      let a = args;
      if (a[0] === "-nonewline") a = a.slice(1);
      const s = a.join(" ");
      env.out.push(s);
      return s;
    }
    case "expr":
      return tclEvalExpr(tclInterpInner(env, args.join(" ").replace(/^\{|\}$/g, "")));
    case "incr": {
      const n = Number(env.vars[args[0]] || "0") + Number(args[1] || "1");
      env.vars[args[0]] = String(n);
      return env.vars[args[0]];
    }
    case "list":
      return args.join(" ");
    case "llength":
      return String(args[0] ? args[0].trim().split(/\s+/).filter(Boolean).length : 0);
    case "lindex": {
      const lst = (args[0] || "").trim().split(/\s+/).filter(Boolean);
      return lst[Number(args[1] || 0)] ?? "";
    }
    case "lappend": {
      const cur = env.vars[args[0]] ? env.vars[args[0]].split(/\s+/).filter(Boolean) : [];
      env.vars[args[0]] = [...cur, ...args.slice(1)].join(" ");
      return env.vars[args[0]];
    }
    case "join":
      return (args[0] || "").trim().split(/\s+/).filter(Boolean).join(args[1] ?? " ");
    case "split":
      return (args[0] || "").split(args[1] || "").join(" ");
    case "string": {
      const sub = args[0];
      if (sub === "length") return String((args[1] || "").length);
      if (sub === "tolower") return (args[1] || "").toLowerCase();
      if (sub === "toupper") return (args[1] || "").toUpperCase();
      if (sub === "equal") return args[1] === args[2] ? "1" : "0";
      if (sub === "match") {
        const re = new RegExp("^" + (args[1] || "").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
        return re.test(args[2] || "") ? "1" : "0";
      }
      return "";
    }
    case "info":
      if (args[0] === "exists") return env.vars[args[1]] !== undefined ? "1" : "0";
      return "";
    case "proc": {
      env.procs[args[0]] = { args: (args[1] || "").trim().split(/\s+/).filter(Boolean), body: args[2] || "" };
      return "";
    }
    case "return":
      return args.join(" ");
    case "if": {
      let k = 0;
      while (k < args.length) {
        if (args[k] === "else") return tclEvalCommand(env, args[k + 1] || "");
        if (args[k] === "elseif") k++;
        const cond = tclEvalExpr(tclInterpInner(env, args[k] || "0"));
        const body = args[k + 1] || "";
        if (cond !== "0" && cond !== "false" && cond !== "") return tclEvalCommand(env, body);
        k += 2;
      }
      return "";
    }
    case "foreach": {
      const varName = args[0];
      const lst = (args[1] || "").trim().split(/\s+/).filter(Boolean);
      const body = args[2] || "";
      let last = "";
      for (const item of lst) {
        env.vars[varName] = item;
        last = tclEvalCommand(env, body);
      }
      return last;
    }
    case "for": {
      tclEvalCommand(env, args[0] || "");
      const body = args[3] || "";
      let last = "";
      let guard = 0;
      while (tclEvalExpr(tclInterpInner(env, args[1] || "0")) !== "0" && guard++ < 1000) {
        last = tclEvalCommand(env, body);
        tclEvalCommand(env, args[2] || "");
      }
      return last;
    }
    case "while": {
      const body = args[1] || "";
      let last = "";
      let guard = 0;
      while (tclEvalExpr(tclInterpInner(env, args[0] || "0")) !== "0" && guard++ < 1000) {
        last = tclEvalCommand(env, body);
      }
      return last;
    }
    case "catch": {
      try {
        tclEvalCommand(env, args[0] || "");
        return "0";
      } catch (e) {
        if (args[1]) env.vars[args[1]] = e instanceof Error ? e.message : String(e);
        return "1";
      }
    }
    default:
      throw new Error(`invalid command name "${cmd}"`);
  }
}

export function runTcl(source: string): LabResult {
  const env: TclEnv = { vars: {}, procs: {}, out: [] };
  try {
    tclEvalCommand(env, source);
    return { ok: true, stdout: env.out.join("\n") };
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e), env.out.join("\n"));
  }
}

/* ───────── Bash teaching subset ───────── */

export function runBash(source: string): LabResult {
  const vars: Record<string, string> = { PATH: "/usr/bin", HOME: "/home/eng", PWD: "/proj" };
  const out: string[] = [];
  const expand = (s: string) =>
    s.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, a, b) => vars[a || b] ?? "");

  try {
    const lines = source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line || line.startsWith("#") || line.startsWith("#!")) continue;
      line = expand(line);
      const asg = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (asg) {
        vars[asg[1]] = asg[2].replace(/^["']|["']$/g, "");
        continue;
      }
      if (line.startsWith("echo ")) {
        out.push(line.slice(5).replace(/^["']|["']$/g, ""));
        continue;
      }
      if (line.startsWith("printf ")) {
        out.push(line.replace(/^printf\s+/, "").replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"));
        continue;
      }
      const forM = line.match(/^for\s+(\w+)\s+in\s+(.+);\s*do$/);
      if (forM) {
        const items = forM[2].trim().split(/\s+/);
        const body: string[] = [];
        i++;
        while (i < lines.length && lines[i].trim() !== "done") {
          body.push(lines[i]);
          i++;
        }
        for (const it of items) {
          vars[forM[1]] = it;
          const inner = runBash(body.map((b) => b.replaceAll("$" + forM[1], it)).join("\n"));
          if (!inner.ok) return inner;
          if (inner.stdout) out.push(inner.stdout);
        }
        continue;
      }
      if (line.startsWith("if ")) continue;
      if (line === "fi" || line === "then" || line.startsWith("else")) continue;
      if (line.includes("|")) {
        const [left, right] = line.split("|").map((s) => s.trim());
        const leftRes = runBash(left);
        const text = leftRes.ok ? leftRes.stdout : "";
        if (right.startsWith("grep ")) {
          const pat = right.slice(5).replace(/^["']|["']$/g, "");
          out.push(
            text
              .split("\n")
              .filter((l) => l.includes(pat))
              .join("\n")
          );
        } else if (right.startsWith("wc")) {
          out.push(String(text.split("\n").filter(Boolean).length));
        } else if (right.startsWith("awk")) {
          const col = right.match(/\$(\d+)/);
          const n = col ? Number(col[1]) : 1;
          out.push(
            text
              .split("\n")
              .map((l) => l.trim().split(/\s+/)[n - 1] || "")
              .filter(Boolean)
              .join("\n")
          );
        } else out.push(text);
        continue;
      }
      out.push(`[bash] ${line}`);
    }
    return { ok: true, stdout: out.filter(Boolean).join("\n") };
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e), out.join("\n"));
  }
}

/* ───────── Python teaching subset ───────── */

export function runPython(source: string): LabResult {
  const out: string[] = [];
  const vars: Record<string, unknown> = {};
  const evalExpr = (expr: string): unknown => {
    const e = expr.trim();
    if ((e.startsWith('"') && e.endsWith('"')) || (e.startsWith("'") && e.endsWith("'"))) return e.slice(1, -1);
    if (/^-?\d+(\.\d+)?$/.test(e)) return Number(e);
    if (e === "True") return true;
    if (e === "False") return false;
    if (vars[e] !== undefined) return vars[e];
    const plus = e.split("+").map((x) => x.trim());
    if (plus.length > 1) {
      const parts = plus.map(evalExpr);
      if (parts.every((p) => typeof p === "number")) return (parts as number[]).reduce((a, b) => a + b, 0);
      return parts.map(String).join("");
    }
    const m = e.match(/^len\((.+)\)$/);
    if (m) {
      const v = evalExpr(m[1]);
      return typeof v === "string" || Array.isArray(v) ? v.length : 0;
    }
    const idx = e.match(/^(\w+)\[(.+)\]$/);
    if (idx && vars[idx[1]] !== undefined) {
      const seq = vars[idx[1]] as unknown;
      const i = evalExpr(idx[2]);
      if (Array.isArray(seq) && typeof i === "number") return seq[i];
      if (seq && typeof seq === "object") return (seq as Record<string, unknown>)[String(i)];
    }
    if (e.startsWith("[") && e.endsWith("]")) {
      return e
        .slice(1, -1)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .map(evalExpr);
    }
    throw new Error(`cannot evaluate: ${expr}`);
  };

  try {
    const lines = source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.replace(/#.*$/, "").trim();
      if (!line) continue;
      if (line.startsWith("import ") || line.startsWith("from ")) continue;
      const pr = line.match(/^print\((.*)\)\s*$/);
      if (pr) {
        const inner = pr[1];
        if (inner.startsWith("f\"") || inner.startsWith("f'")) {
          const tpl = inner.slice(2, -1);
          out.push(tpl.replace(/\{([^}]+)\}/g, (_, ex) => String(evalExpr(ex))));
        } else {
          const parts = inner.split(",").map((p) => String(evalExpr(p.trim())));
          out.push(parts.join(" "));
        }
        continue;
      }
      const asg = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
      if (asg) {
        vars[asg[1]] = evalExpr(asg[2]);
        continue;
      }
      const fr = line.match(/^for\s+(\w+)\s+in\s+range\((\d+)\):$/);
      if (fr) {
        const body: string[] = [];
        i++;
        while (i < lines.length && (lines[i].startsWith("    ") || lines[i].startsWith("\t") || !lines[i].trim())) {
          body.push(lines[i].replace(/^\s{4}|\t/, ""));
          i++;
        }
        i--;
        const n = Number(fr[2]);
        for (let k = 0; k < n; k++) {
          vars[fr[1]] = k;
          const inner = runPython(
            body
              .join("\n")
              .replace(new RegExp(`\\b${fr[1]}\\b`, "g"), String(k))
          );
          if (inner.stdout) out.push(inner.stdout);
        }
        continue;
      }
      if (line.endsWith(":")) continue;
    }
    return { ok: true, stdout: out.join("\n") };
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e), out.join("\n"));
  }
}

/* ───────── Perl teaching subset ───────── */

export function runPerl(source: string): LabResult {
  const scalars: Record<string, string> = {};
  const arrays: Record<string, string[]> = {};
  const hashes: Record<string, Record<string, string>> = {};
  const out: string[] = [];
  const expS = (s: string) =>
    s.replace(/\$([A-Za-z_]\w*)/g, (_, n) => scalars[n] ?? "").replace(/\\n/g, "\n");

  try {
    let skipBlock = 0;
    for (const raw of source.split("\n")) {
      if (skipBlock) {
        if (raw.includes("{")) skipBlock++;
        if (raw.trim().startsWith("}")) skipBlock--;
        continue;
      }
      const line = raw.replace(/^\s*#.*$/, "").trim().replace(/;$/, "");
      if (!line || line.startsWith("use ")) continue;
      const myS = line.match(/^my\s+\$(\w+)\s*=\s*(.+)$/);
      if (myS) {
        let v = myS[2].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        else if (/^-?\d/.test(v)) v = v;
        else v = expS(v);
        scalars[myS[1]] = expS(v);
        continue;
      }
      const myA = line.match(/^my\s+@(\w+)\s*=\s*\((.+)\)$/);
      if (myA) {
        arrays[myA[1]] = myA[2].split(",").map((x) => x.trim().replace(/^["']|["']$/g, ""));
        continue;
      }
      const pr = line.match(/^print\s+(.+)$/);
      if (pr) {
        out.push(expS(pr[1].replace(/^["']|["']$/g, "")));
        continue;
      }
      const eq = line.match(/^\$(\w+)\s*=\s*(.+)$/);
      if (eq) {
        scalars[eq[1]] = expS(eq[2].replace(/^["']|["']$/g, ""));
        continue;
      }
      const fe = line.match(/^foreach\s+(?:my\s+)?\$(\w+)\s+\(@(\w+)\)/);
      if (fe) {
        skipBlock = raw.includes("{") ? 1 : 1;
        continue;
      }
    }
    const src = source.split("\n");
    for (let i = 0; i < src.length; i++) {
      const fe = src[i].match(/foreach\s+(?:my\s+)?\$(\w+)\s+\(@(\w+)\)\s*\{/);
      if (!fe) continue;
      const body: string[] = [];
      i++;
      while (i < src.length && !src[i].trim().startsWith("}")) {
        body.push(src[i]);
        i++;
      }
      for (const item of arrays[fe[2]] || []) {
        const expanded = body.join("\n").replace(new RegExp("\\$" + fe[1] + "\\b", "g"), item);
        const inner = runPerl(expanded);
        if (inner.stdout) out.push(inner.stdout);
      }
    }
    return { ok: true, stdout: out.join("") };
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e), out.join(""));
  }
}

export function runXmlXPath(xml: string, xpath: string): LabResult {
  try {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const err = doc.querySelector("parsererror");
    if (err) return fail("XML parse error");
    const it = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
    const bits: string[] = [];
    if (it.resultType === XPathResult.STRING_TYPE) bits.push(it.stringValue);
    else if (it.resultType === XPathResult.NUMBER_TYPE) bits.push(String(it.numberValue));
    else if (it.resultType === XPathResult.BOOLEAN_TYPE) bits.push(String(it.booleanValue));
    else {
      let n = it.iterateNext();
      while (n) {
        bits.push(n.textContent || n.nodeName);
        n = it.iterateNext();
      }
    }
    return { ok: true, stdout: bits.join("\n") || "(no match)" };
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
}

export function runLang(lang: string, source: string, extra?: string): LabResult {
  const l = lang.toLowerCase();
  if (l === "tcl") return runTcl(source);
  if (l === "bash" || l === "shell" || l === "sh") return runBash(source);
  if (l === "python" || l === "py") return runPython(source);
  if (l === "perl" || l === "pl") return runPerl(source);
  if (l === "xml") return runXmlXPath(source, extra || "//*");
  return fail(`No in-browser runner for ${lang} yet`);
}
