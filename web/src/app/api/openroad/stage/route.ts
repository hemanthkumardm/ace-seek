import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import type { OpenroadProjectState } from "@/lib/openroad-project-hub";
import type { FlowStageId } from "@/lib/openroad-flow-model";
import { executeOpenroadJob } from "@/lib/openroad-run-engine";
import {
  isTbName,
  runFrontendTools,
  dockerAvailable,
  hostLibertyExists,
  hostLibertyPath,
  containerLibertyPath,
  pdkRoot,
  resolveToolsMode,
} from "@/lib/openroad-docker-tools";
import {
  runPreAssertions,
  runPostAssertions,
  assertionsOk,
  getStageNode,
} from "@/lib/openroad-stage-nodes";
import {
  writeStageCheckpoint,
  resolveCheckpointInfo,
} from "@/lib/openroad-checkpoints";
import type { StageInputValues } from "@/lib/openroad-stage-config";
import { emptyStageInputValues } from "@/lib/openroad-stage-config";
import { getOpenroadJobsRoot, requireOpenroadOwner } from "@/lib/openroad-owner";

function configuredHostMissingCritical(
  stage: string,
  host: {
    verilator: string | null;
    iverilog: string | null;
    vvp: string | null;
    yosys: string | null;
  }
): boolean {
  if (stage === "lint") return !host.verilator;
  if (stage === "simulation") return !host.iverilog || !host.vvp;
  if (stage === "synthesis") return !host.yosys;
  return false;
}

function writeProjectTree(
  work: string,
  project: OpenroadProjectState
): { rtlDir: string; tbDir: string } {
  const rtlDir = path.join(work, "rtl");
  const tbDir = path.join(work, "tb");
  fs.mkdirSync(rtlDir, { recursive: true });
  fs.mkdirSync(tbDir, { recursive: true });
  for (const f of project.files) {
    const base = path.basename(f.name);
    const lower = f.name.replace(/\\/g, "/").toLowerCase();
    if (/\.sdc$/i.test(base) || /constraint/i.test(base)) {
      fs.writeFileSync(path.join(work, "constraints.sdc"), f.content);
    } else if (
      lower.includes("/tb/") ||
      /^tb_/i.test(base) ||
      isTbName(f.name)
    ) {
      fs.writeFileSync(path.join(tbDir, base), f.content);
    } else if (/\.(v|sv)$/i.test(base)) {
      fs.writeFileSync(path.join(rtlDir, base), f.content);
    }
  }
  return { rtlDir, tbDir };
}

/**
 * Frontend stages: ACE_TOOLS_MODE=host|docker|auto
 *   lint / sim / synth → host binaries or tools Docker image
 * PnR (floorplan+): always OpenLane Docker
 */
export async function POST(req: NextRequest) {
  try {
    const gate = requireOpenroadOwner(req);
    if (gate instanceof NextResponse) return gate;
    const { owner, ent } = gate;

    const body = (await req.json()) as {
      apiKey?: string;
      stage?: FlowStageId;
      project?: OpenroadProjectState;
      openlaneConfig?: Record<string, string | number | boolean>;
      lintTop?: string;
      simTbTop?: string;
      /** Stage form values for pre-assertions */
      stageInputs?: StageInputValues;
      completedStages?: FlowStageId[];
    };
    if (!body.project || !body.stage) {
      return NextResponse.json(
        { error: "stage and project required" },
        { status: 400 }
      );
    }

    const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
    const externalOpenroadUrl = (
      process.env.OPENROAD_API_URL ||
      process.env.DOC_COMPILER_API_URL ||
      process.env.BACKEND_API_URL ||
      process.env.EC2_BACKEND_URL ||
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL
    )?.replace(/\/$/, "");

    if (externalOpenroadUrl && (!process.env.AIC_FORCE_LOCAL || isVercel)) {
      try {
        const targetUrl = new URL(`${externalOpenroadUrl}/api/openroad/stage`);
        req.nextUrl.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v));
        const res = await fetch(targetUrl.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(req.headers.get("x-api-key") ? { "x-api-key": req.headers.get("x-api-key")! } : {}),
            ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}),
            ...(req.headers.get("cookie") ? { cookie: req.headers.get("cookie")! } : {}),
            "x-openroad-owner": owner.ownerId,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } catch (err) {
        if (isVercel) {
          return NextResponse.json(
            {
              error: `OpenROAD EC2 runner (${externalOpenroadUrl}) unreachable: ${
                err instanceof Error ? err.message : String(err)
              }`,
            },
            { status: 503 }
          );
        }
      }
    }

    const toolsMode = resolveToolsMode();
    const stage = body.stage;
    const project = body.project;
    const pnrStages = [
      "floorplan",
      "powerplan",
      "placement",
      "cts",
      "route",
      "drc",
      "lvs",
      "gds",
    ];
    if (pnrStages.includes(stage) && !dockerAvailable()) {
      return NextResponse.json(
        {
          error:
            "Docker is required for OpenLane PnR (floorplan→GDS). Lint/sim/synth can use ACE_TOOLS_MODE=host.",
        },
        { status: 503 }
      );
    }
    if (
      ["lint", "simulation", "synthesis"].includes(stage) &&
      toolsMode.mode === "docker" &&
      !toolsMode.docker
    ) {
      return NextResponse.json(
        {
          error: `Frontend tools need Docker or host install. ${toolsMode.reason}. Set ACE_TOOLS_MODE=host and install verilator/iverilog/yosys, or fix Docker.`,
        },
        { status: 503 }
      );
    }
    if (
      ["lint", "simulation", "synthesis"].includes(stage) &&
      toolsMode.mode === "host" &&
      !toolsMode.host.ok &&
      configuredHostMissingCritical(stage, toolsMode.host)
    ) {
      return NextResponse.json(
        {
          error: `ACE_TOOLS_MODE=host but required binary missing for ${stage}. ${toolsMode.reason}`,
          hostTools: toolsMode.host,
        },
        { status: 503 }
      );
    }
    const stageInputs = body.stageInputs || emptyStageInputValues();
    const completedStages = body.completedStages || [];
    const ckptInfo = resolveCheckpointInfo(
      project.designName || "design",
      project.topModule || "top",
      owner.ownerId
    );
    const hasCkpt = ckptInfo.exists;

    // Stage node preconditions
    const preAssert = runPreAssertions(stage, project, stageInputs, {
      completed: completedStages,
      hasCheckpoint: hasCkpt,
    });
    if (!assertionsOk(preAssert)) {
      return NextResponse.json({
        ok: false,
        stage,
        assertions: preAssert,
        error: preAssert
          .filter((a) => a.level === "error")
          .map((a) => a.message)
          .join("; "),
      });
    }

    const stageTmpBase = path.join(getOpenroadJobsRoot(), "tmp");
    fs.mkdirSync(stageTmpBase, { recursive: true });
    const work = fs.mkdtempSync(path.join(stageTmpBase, "ace-stage-"));

    try {
      const { rtlDir, tbDir } = writeProjectTree(work, project);
      const node = getStageNode(stage);

      // ── Lint (Verilator host or Docker) ────────────────────────
      if (stage === "lint") {
        if (!ent.canOpenroadScripts && !ent.canOpenroadRun) {
          return NextResponse.json({ error: "Pro+ required" }, { status: 403 });
        }
        const top =
          body.lintTop ||
          (body.openlaneConfig?.LINT_TOP as string) ||
          project.topModule ||
          "top";
        const rtlFiles = fs.existsSync(rtlDir)
          ? fs.readdirSync(rtlDir).filter((n) => /\.(v|sv)$/i.test(n))
          : [];
        if (!rtlFiles.length) {
          return NextResponse.json({
            ok: false,
            stage,
            result: {
              kind: "lint",
              summary: "No RTL files in project",
              errorCount: 1,
              warnCount: 0,
              log: "ERROR: no .v/.sv files",
            },
          });
        }
        const fileArgs = rtlFiles.map((n) => `rtl/${n}`).join(" ");
        const r = runFrontendTools(
          work,
          `set -e
echo "Ace-Seek lint"
echo "TOP=${top}"
verilator --lint-only -Wall -Wno-DECLFILENAME -Wno-fatal --top-module ${top} ${fileArgs}
echo "LINT_DONE exit=$?"
`,
          { timeoutMs: 120_000 }
        );
        const log = r.log;
        const errorCount = (log.match(/%Error/g) || []).length;
        const warnCount = (log.match(/%Warning/g) || []).length;
        const ok = r.ok || errorCount === 0;
        const modeLabel = r.mode === "host" ? "host" : "Docker";
        const result = {
          kind: "lint" as const,
          summary: ok
            ? `Lint OK (${modeLabel} Verilator) — ${warnCount} warning(s), ${errorCount} error(s)`
            : `Lint failed (${modeLabel}) — ${errorCount} error(s), ${warnCount} warning(s)`,
          errorCount,
          warnCount,
          log,
        };
        const postAssert = runPostAssertions("lint", result, { ok });
        return NextResponse.json({
          ok,
          stage,
          node,
          toolsMode: r.mode,
          assertions: [...preAssert, ...postAssert],
          result,
        });
      }

      // ── Simulation (Icarus host or Docker) ─────────────────────
      if (stage === "simulation") {
        if (!ent.canOpenroadScripts && !ent.canOpenroadRun) {
          return NextResponse.json({ error: "Pro+ required" }, { status: 403 });
        }
        const tbTop =
          body.simTbTop ||
          (body.openlaneConfig?.SIM_TB_TOP as string) ||
          "tb_top";
        const rtlFiles = fs.existsSync(rtlDir)
          ? fs.readdirSync(rtlDir).filter((n) => /\.(v|sv)$/i.test(n))
          : [];
        const tbFiles = fs.existsSync(tbDir)
          ? fs.readdirSync(tbDir).filter((n) => /\.(v|sv)$/i.test(n))
          : [];
        if (!tbFiles.length) {
          return NextResponse.json({
            ok: false,
            stage,
            result: {
              kind: "sim",
              summary: "No testbench file (tb_*.v) in project",
              ok: false,
              log: "ERROR: missing testbench",
            },
          });
        }
        const rtlArgs = rtlFiles.map((n) => `rtl/${n}`).join(" ");
        const tbArgs = tbFiles.map((n) => `tb/${n}`).join(" ");
        const r = runFrontendTools(
          work,
          `set -e
echo "Ace-Seek sim"
echo "TB_TOP=${tbTop}"
iverilog -g2012 -o sim.vvp -s ${tbTop} ${rtlArgs} ${tbArgs}
vvp sim.vvp
echo "SIM_DONE exit=$?"
`,
          { timeoutMs: 120_000 }
        );
        const log = r.log;
        const simOk = /SIM_OK/i.test(log) || r.ok;
        let vcd = "";
        for (const n of fs.readdirSync(work)) {
          if (n.endsWith(".vcd")) {
            vcd = fs.readFileSync(path.join(work, n), "utf8");
            break;
          }
        }
        const modeLabel = r.mode === "host" ? "host" : "Docker";
        const result = {
          kind: "sim" as const,
          summary: simOk
            ? `Simulation finished (${modeLabel} Icarus — SIM_OK or exit 0)`
            : `Simulation failed (${modeLabel})`,
          ok: simOk,
          log,
          vcd: vcd.slice(0, 500_000),
        };
        const postAssert = runPostAssertions("simulation", result, {
          ok: simOk,
        });
        return NextResponse.json({
          ok: simOk,
          stage,
          node,
          toolsMode: r.mode,
          assertions: [...preAssert, ...postAssert],
          result,
        });
      }

      // ── Synthesis (Yosys host or Docker) ───────────────────────
      if (stage === "synthesis") {
        if (!ent.canOpenroadScripts && !ent.canOpenroadRun) {
          return NextResponse.json({ error: "Pro+ required" }, { status: 403 });
        }
        const top =
          (body.openlaneConfig?.DESIGN_NAME as string) ||
          project.topModule ||
          "top";
        const rtlFiles = fs.existsSync(rtlDir)
          ? fs
              .readdirSync(rtlDir)
              .filter((n) => /\.(v|sv)$/i.test(n) && !isTbName(n))
          : [];
        if (!rtlFiles.length) {
          return NextResponse.json({
            ok: false,
            stage,
            result: {
              kind: "synth",
              summary: "No RTL for synthesis",
              log: "ERROR: no design .v/.sv (testbenches excluded)",
              statsLines: [],
            },
          });
        }

        const useLib = hostLibertyExists();
        // Host path for liberty; in Docker, PDK is mounted at /pdk
        const libHost = hostLibertyPath();
        const libDocker = containerLibertyPath();
        // Write synth.ys with placeholder; rewrite for mode
        const reads = rtlFiles
          .map((n) => `read_verilog rtl/${n}`)
          .join("\n");

        const buildYs = (libPath: string | null) => {
          const synthBody = libPath
            ? [
                `hierarchy -check -top ${top}`,
                "proc; opt; fsm; opt; memory; opt",
                `synth -top ${top} -flatten`,
                `dfflibmap -liberty ${JSON.stringify(libPath)}`,
                `abc -liberty ${JSON.stringify(libPath)}`,
                "opt_clean",
              ].join("\n")
            : [
                `hierarchy -check -top ${top}`,
                `synth -top ${top}`,
                "opt_clean",
              ].join("\n");
          return [
            "# Ace-Seek Yosys synthesis (host or Docker)",
            reads,
            synthBody,
            "stat",
            "write_verilog -noattr synth_netlist.v",
          ].join("\n");
        };

        // Prefer host mode path if auto resolved to host; liberty path differs
        const modeNow = toolsMode.mode;
        const libForMode =
          useLib && modeNow === "host"
            ? libHost
            : useLib && modeNow === "docker"
              ? libDocker
              : null;
        fs.writeFileSync(path.join(work, "synth.ys"), buildYs(libForMode), "utf8");

        // If auto would use docker but we wrote host liberty, re-resolve via runFrontendTools
        // For host: liberty is absolute host path. For docker: container path + mountPdk.
        if (modeNow === "host" && useLib) {
          fs.writeFileSync(path.join(work, "synth.ys"), buildYs(libHost), "utf8");
        } else if (modeNow === "docker" && useLib) {
          fs.writeFileSync(
            path.join(work, "synth.ys"),
            buildYs(libDocker),
            "utf8"
          );
        }

        const r = runFrontendTools(
          work,
          `set -e
echo "Ace-Seek synth (Yosys)"
echo "TOP=${top} LIBERTY=${libForMode || "(generic)"}"
yosys -s synth.ys
echo "SYNTH_DONE exit=$?"
`,
          { mountPdk: useLib && modeNow === "docker", timeoutMs: 600_000 }
        );

        // If auto-picked host but liberty was wrong, unlikely. If docker with host path failed, retry.
        const log = r.log;
        const cellM = log.match(/Number of cells:\s+(\d+)/i);
        const wireM = log.match(/Number of wires:\s+(\d+)/i);
        const cellCount = cellM ? parseInt(cellM[1], 10) : undefined;
        const wireCount = wireM ? parseInt(wireM[1], 10) : undefined;
        const statsLines = log
          .split("\n")
          .filter((l) =>
            /Number of (cells|wires|wire bits|public wires)|Chip area|^\s+\$_|^\s+sky130_/i.test(
              l
            )
          )
          .slice(0, 40);
        const ok = r.ok && !/ERROR: Can't open|ERROR: Module/i.test(log);
        let netlist: string | undefined;
        const outV = path.join(work, "synth_netlist.v");
        if (ok && fs.existsSync(outV)) {
          netlist = fs.readFileSync(outV, "utf8").slice(0, 200_000);
        }
        const modeLabel = r.mode === "host" ? "host" : "Docker";

        const result = {
          kind: "synth" as const,
          summary: ok
            ? `Yosys synthesis OK (${modeLabel})${
                cellCount != null ? ` — ${cellCount} cells` : ""
              }${useLib ? " · sky130 liberty" : " · generic"}`
            : `Yosys synthesis failed (${modeLabel}, exit ${r.status})`,
          cellCount,
          wireCount,
          log: `PDK_ROOT=${pdkRoot()}\n${log}`,
          statsLines,
          netlist,
        };
        // Stage checkpoint after successful synth
        let checkpointPath: string | undefined;
        if (ok && netlist) {
          try {
            const sdc =
              fs.existsSync(path.join(work, "constraints.sdc"))
                ? fs.readFileSync(path.join(work, "constraints.sdc"), "utf8")
                : "";
            const { dir, manifest } = writeStageCheckpoint({
              designName: project.designName || "design",
              topModule: top,
              pdk: project.pdk || "sky130",
              stage: "synthesis",
              ownerId: owner.ownerId,
              files: {
                "synth_netlist.v": netlist,
                ...(sdc ? { "constraints.sdc": sdc } : {}),
                "yosys.log": log.slice(-200_000),
                "synth.ys": fs.readFileSync(path.join(work, "synth.ys"), "utf8"),
              },
              metrics: {
                cellCount,
                wireCount,
                summary: result.summary,
              },
            });
            checkpointPath = dir;
            result.log += `\nACE-Seek: checkpoint written stage=synthesis path=${dir} files=${manifest.files.length}\n`;
          } catch (e) {
            result.log += `\nACE-Seek: checkpoint write failed: ${
              e instanceof Error ? e.message : e
            }\n`;
          }
        }
        const postAssert = runPostAssertions("synthesis", result, { ok });
        return NextResponse.json({
          ok,
          stage: "synthesis",
          node,
          toolsMode: r.mode,
          assertions: [...preAssert, ...postAssert],
          checkpoint: checkpointPath
            ? { path: checkpointPath, stage: "synthesis" }
            : undefined,
          result,
        });
      }

      // ── IO Planner (local — ports → N/S/E/W → pin_order.cfg) ──
      if (stage === "io_plan") {
        const {
          parsePortsFromProject,
          parseIoPlanJson,
          reconcilePlan,
          planIsComplete,
          planSummary,
          buildPinOrderCfg,
          allPins,
          autoPlacePorts,
          PIN_SIDES,
        } = await import("@/lib/openroad-io-plan");
        const ports = parsePortsFromProject(project);
        if (!ports.length) {
          return NextResponse.json({
            ok: false,
            stage,
            node,
            assertions: preAssert,
            error:
              "No ports found on top module — check Design/RTL and top module name",
            result: {
              kind: "io_plan",
              summary: "No ports parsed from RTL",
              log: "ACE-Seek: io_plan failed — empty port list\n",
              placed: 0,
              total: 0,
              sides: { N: 0, E: 0, S: 0, W: 0 },
            },
          });
        }
        let plan = reconcilePlan(
          ports,
          parseIoPlanJson(
            String(stageInputs.io_plan?.IO_PLAN_JSON || "").trim() || null
          )
        );
        plan.topModule = project.topModule || "top";
        // Auto-place any remaining unplaced pins so Run always produces a cfg
        const placedSet = new Set(
          PIN_SIDES.flatMap((s) => plan.order[s])
        );
        const missing = allPins(ports).filter((p) => !placedSet.has(p));
        if (missing.length) {
          const auto = autoPlacePorts(
            ports.filter((p) => p.pins.some((pin) => missing.includes(pin)))
          );
          for (const s of PIN_SIDES) {
            for (const pin of auto[s]) {
              if (missing.includes(pin) && !plan.order[s].includes(pin)) {
                plan.order[s].push(pin);
              }
            }
          }
        }
        plan.updatedAt = new Date().toISOString();
        const cfg = buildPinOrderCfg(plan.order, {
          comment: `top=${plan.topModule}`,
        });
        const total = allPins(ports).length;
        const placed = PIN_SIDES.reduce((n, s) => n + plan.order[s].length, 0);
        const sides = {
          N: plan.order.N.length,
          E: plan.order.E.length,
          S: plan.order.S.length,
          W: plan.order.W.length,
        };
        const complete = planIsComplete(plan);
        const log = [
          "ACE-Seek: === step io_plan ===",
          `top=${plan.topModule} ports=${ports.length} pins=${total}`,
          planSummary(plan),
          `sides N=${sides.N} E=${sides.E} S=${sides.S} W=${sides.W}`,
          complete
            ? "All pins assigned — pin_order.cfg ready for floorplan"
            : "Warning: some pins may still be unassigned",
          "",
          "--- pin_order.cfg ---",
          cfg,
          "--- end pin_order.cfg ---",
          "FP_PIN_ORDER_CFG=dir::pin_order.cfg (applied on floorplan when enabled)",
        ].join("\n");
        const result = {
          kind: "io_plan" as const,
          summary: planSummary(plan),
          log,
          pinOrderCfg: cfg,
          placed,
          total,
          sides,
        };
        const postAssert = runPostAssertions("io_plan", result, {
          ok: complete,
        });
        return NextResponse.json({
          ok: complete && placed > 0,
          stage,
          node,
          assertions: [...preAssert, ...postAssert],
          result,
          /** Client should persist these into project files / stageInputs */
          ioPlan: {
            planJson: JSON.stringify(plan),
            pinOrderCfg: cfg,
          },
        });
      }

      // ── Floorplan+ (OpenLane Docker) ───────────────────────────
      if (
        [
          "floorplan",
          "powerplan",
          "placement",
          "cts",
          "route",
          "drc",
          "lvs",
          "gds",
        ].includes(stage)
      ) {
        if (!ent.canOpenroadRun) {
          return NextResponse.json(
            { error: "OpenLane PnR stages require Max" },
            { status: 403 }
          );
        }
        const result = executeOpenroadJob({
          project,
          mode: "container",
          openlaneConfig: body.openlaneConfig,
          untilStage: stage,
          owner,
        });
        if (result.status === "rejected") {
          const queueFull = /queue full/i.test(result.message || "");
          const busy = /already (queued|preparing|running|active)/i.test(
            result.message || ""
          );
          return NextResponse.json(
            {
              ok: false,
              stage,
              error: result.message,
              openlaneJob: result,
            },
            { status: queueFull ? 429 : busy ? 409 : 400 }
          );
        }
        return NextResponse.json({
          ok: true,
          stage,
          node,
          assertions: preAssert,
          openlaneJob: result,
          message:
            result.status === "queued"
              ? `OpenLane queued — will run when a concurrency slot frees (stops after '${stage}').`
              : `OpenLane Docker started — stops after '${stage}' (modular stage node). Checkpoint will update on success.`,
        });
      }

      return NextResponse.json({ error: `Unknown stage ${stage}` }, { status: 400 });
    } finally {
      try {
        fs.rmSync(work, { recursive: true, force: true });
      } catch {
        /* */
      }
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "stage failed" },
      { status: 500 }
    );
  }
}
