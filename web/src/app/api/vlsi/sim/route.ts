import { NextRequest, NextResponse } from "next/server";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const execFileAsync = promisify(execFile);
const MAX_SRC = 80_000;

function whichOk(bin: string): boolean {
  try {
    const { execFileSync } = require("child_process") as typeof import("child_process");
    execFileSync("which", [bin], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    iverilog: whichOk("iverilog"),
    vvp: whichOk("vvp"),
  });
}

export async function POST(req: NextRequest) {
  if (!whichOk("iverilog") || !whichOk("vvp")) {
    return NextResponse.json(
      {
        ok: false,
        error: "Icarus Verilog is not installed on this host (need iverilog + vvp).",
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const dut = String(body.dut || "");
  const tb = String(body.tb || "");
  if (!dut.trim() || !tb.trim()) {
    return NextResponse.json({ ok: false, error: "DUT and testbench are required." }, { status: 400 });
  }
  if (dut.length + tb.length > MAX_SRC) {
    return NextResponse.json({ ok: false, error: "Source too large." }, { status: 400 });
  }

  const dir = mkdtempSync(join(tmpdir(), "ace-rtl-"));
  try {
    writeFileSync(join(dir, "dut.v"), dut);
    writeFileSync(join(dir, "tb.v"), tb);
    try {
      await execFileAsync("iverilog", ["-g2012", "-o", "sim.vvp", "dut.v", "tb.v"], {
        cwd: dir,
        timeout: 12_000,
        maxBuffer: 2_000_000,
      });
    } catch (err: unknown) {
      const e = err as { stderr?: string; stdout?: string; message?: string };
      return NextResponse.json({
        ok: false,
        stage: "compile",
        error: (e.stderr || e.stdout || e.message || "iverilog failed").toString().slice(0, 12_000),
      });
    }

    let stdout = "";
    let stderr = "";
    try {
      const run = await execFileAsync("vvp", ["sim.vvp"], {
        cwd: dir,
        timeout: 12_000,
        maxBuffer: 2_000_000,
      });
      stdout = String(run.stdout || "");
      stderr = String(run.stderr || "");
    } catch (err: unknown) {
      const e = err as { stderr?: string; stdout?: string; message?: string };
      stdout = String(e.stdout || "");
      stderr = String(e.stderr || e.message || "vvp failed");
      return NextResponse.json({
        ok: false,
        stage: "sim",
        stdout: stdout.slice(0, 20_000),
        error: stderr.toString().slice(0, 12_000),
      });
    }

    let vcd = "";
    const vcdPath = join(dir, "wave.vcd");
    if (existsSync(vcdPath)) {
      vcd = readFileSync(vcdPath, "utf8").slice(0, 400_000);
    }

    return NextResponse.json({
      ok: true,
      stage: "done",
      stdout: stdout.slice(0, 20_000),
      stderr: stderr.slice(0, 8_000),
      vcd,
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
