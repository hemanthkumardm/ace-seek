import { NextRequest } from "next/server";
import { pollOpenroadJob } from "@/lib/openroad-run-engine";
import { requireOpenroadOwner } from "@/lib/openroad-owner";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ jobId: string }> };

/**
 * GET /api/openroad/jobs/:jobId/stream?apiKey=
 * Server-Sent Events — live status + logTail (auth via query apiKey; EventSource can't set headers).
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  const gate = requireOpenroadOwner(req);
  if (gate instanceof NextResponse) return gate;
  const { owner } = gate;
  const { jobId } = await ctx.params;

  const encoder = new TextEncoder();
  let closed = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastSig = "";

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      send("hello", {
        jobId,
        ownerId: owner.ownerId,
        ts: new Date().toISOString(),
      });

      const tick = () => {
        if (closed) return;
        const result = pollOpenroadJob(jobId, owner.ownerId);
        if (!result) {
          send("error", { error: "Job not found" });
          cleanup();
          try {
            controller.close();
          } catch {
            /* */
          }
          return;
        }
        const sig = `${result.status}|${result.message}|${result.log?.length || 0}|${result.artifacts?.length || 0}`;
        if (sig !== lastSig) {
          lastSig = sig;
          send("job", { ok: true, result });
        } else {
          send("ping", { ts: Date.now(), status: result.status });
        }
        const terminal =
          result.status === "succeeded" ||
          result.status === "failed" ||
          result.status === "rejected";
        if (terminal) {
          send("done", { status: result.status });
          cleanup();
          try {
            controller.close();
          } catch {
            /* */
          }
        }
      };

      const cleanup = () => {
        closed = true;
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      };

      tick();
      timer = setInterval(tick, 1000);

      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          /* */
        }
      });
    },
    cancel() {
      closed = true;
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
