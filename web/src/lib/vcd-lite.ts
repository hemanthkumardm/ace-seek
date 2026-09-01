/** Minimal VCD parser for scalar / small-vector waves. */

export type VcdWave = {
  name: string;
  width: number;
  samples: { t: number; v: string }[];
};

export type ParsedVcd = {
  timescale: string;
  endTime: number;
  waves: VcdWave[];
};

export function parseVcd(src: string, maxSignals = 16): ParsedVcd | null {
  if (!src.trim()) return null;
  const idToWave = new Map<string, VcdWave>();
  const waves: VcdWave[] = [];
  let timescale = "1ns";
  let t = 0;
  let endTime = 0;

  const lines = src.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith("$timescale")) {
      const chunk = [line];
      while (!lines[i].includes("$end") && i < lines.length - 1) {
        i += 1;
        chunk.push(lines[i].trim());
      }
      timescale = chunk.join(" ").replace("$timescale", "").replace("$end", "").trim() || timescale;
    } else if (line.startsWith("$var")) {
      const parts = line.split(/\s+/);
      // $var wire 1 ! clk $end
      if (parts.length >= 5) {
        const width = Number(parts[2]) || 1;
        const id = parts[3];
        const name = parts[4];
        if (!idToWave.has(id) && waves.length < maxSignals) {
          const w: VcdWave = { name, width, samples: [{ t: 0, v: width === 1 ? "x" : "x" }] };
          idToWave.set(id, w);
          waves.push(w);
        }
      }
    } else if (line.startsWith("#")) {
      t = Number(line.slice(1)) || 0;
      endTime = Math.max(endTime, t);
    } else if (line[0] === "0" || line[0] === "1" || line[0] === "x" || line[0] === "z" || line[0] === "X" || line[0] === "Z") {
      const v = line[0].toLowerCase();
      const id = line.slice(1);
      const w = idToWave.get(id);
      if (w) {
        w.samples.push({ t, v });
        endTime = Math.max(endTime, t);
      }
    } else if (line[0] === "b" || line[0] === "B") {
      const sp = line.indexOf(" ");
      if (sp > 0) {
        const v = line.slice(1, sp);
        const id = line.slice(sp + 1).trim();
        const w = idToWave.get(id);
        if (w) {
          w.samples.push({ t, v });
          endTime = Math.max(endTime, t);
        }
      }
    }
    i += 1;
  }

  return { timescale, endTime: endTime || 1, waves };
}
