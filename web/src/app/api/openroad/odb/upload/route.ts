import { NextRequest, NextResponse } from "next/server";
import {
  saveUploadedOdb,
  startOpenroadOdbGui,
  validateOdbReadable,
} from "@/lib/openroad-odb-viewer";
import { requireOpenroadOwner } from "@/lib/openroad-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Allow large ODB bodies (placement ODBs are often 10–50MB+) */
export const maxDuration = 300;

/**
 * POST upload ODB — two modes:
 * 1) Preferred: raw body (application/octet-stream) + header x-odb-filename
 * 2) Fallback: multipart FormData field "file"
 *
 * Raw upload avoids Next.js FormData parse failures on large ODBs.
 * Sprint A: uploads land under owners/<id>/uploads/.
 */
export async function POST(req: NextRequest) {
  try {
    const gate = requireOpenroadOwner(req);
    if (gate instanceof NextResponse) return gate;
    const { owner } = gate;

    const openParam = req.nextUrl.searchParams.get("open");
    let open = openParam !== "0" && openParam !== "false";
    let name = "design.odb";
    let buf: Buffer;

    const ct = (req.headers.get("content-type") || "").toLowerCase();

    if (ct.includes("multipart/form-data")) {
      // FormData path (small files / legacy)
      let form: FormData;
      try {
        form = await req.formData();
      } catch (e) {
        return NextResponse.json(
          {
            error:
              e instanceof Error
                ? e.message
                : "Failed to parse FormData — use octet-stream upload for large ODBs",
            hint: "Send Content-Type: application/octet-stream with header x-odb-filename",
          },
          { status: 400 }
        );
      }
      const file = form.get("file");
      if (!file || typeof file === "string") {
        return NextResponse.json(
          { error: "multipart field 'file' (.odb) required" },
          { status: 400 }
        );
      }
      // File / Blob in undici
      const blob = file as Blob & { name?: string };
      name = blob.name || "design.odb";
      buf = Buffer.from(await blob.arrayBuffer());
      if (form.get("open") === "0" || form.get("open") === "false") open = false;
    } else {
      // Raw binary path (recommended for 10MB+ ODB)
      name =
        req.headers.get("x-odb-filename") ||
        req.headers.get("x-filename") ||
        "design.odb";
      const ab = await req.arrayBuffer();
      buf = Buffer.from(ab);
    }

    name = name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    if (!/\.odb$/i.test(name)) name = `${name}.odb`;

    if (buf.length < 100) {
      return NextResponse.json(
        { error: "ODB file too small / empty body" },
        { status: 400 }
      );
    }
    if (buf.length > 800_000_000) {
      return NextResponse.json(
        { error: "ODB too large (>800MB)" },
        { status: 400 }
      );
    }

    // Detect silent proxy truncation (Next.js default was 10MB → ORD-0054)
    const declared = Number(req.headers.get("content-length") || 0);
    if (declared > 0 && buf.length < declared) {
      return NextResponse.json(
        {
          error: `ODB upload truncated: received ${buf.length} of ${declared} bytes. Raise experimental.proxyClientMaxBodySize (needs Next restart) or open the stage ODB from the job instead of re-uploading.`,
          received: buf.length,
          contentLength: declared,
          hint: "Prefer «Open stage ODB» — it mounts the file from disk with no upload.",
        },
        { status: 413 }
      );
    }

    // OpenROAD ODB magic is little-endian "NADBATHE" → bytes EHTABDAN
    const magic = buf.subarray(0, 8).toString("ascii");
    if (magic !== "EHTABDAN") {
      return NextResponse.json(
        {
          error: `Not a valid OpenROAD ODB (magic="${magic}", expected EHTABDAN). File may be corrupt or not an .odb.`,
          size: buf.length,
        },
        { status: 400 }
      );
    }

    const saved = saveUploadedOdb(buf, name, owner);

    // Prove OpenROAD can read it BEFORE launching GUI (catches truncation)
    const check = validateOdbReadable(saved.path);
    if (!check.ok) {
      return NextResponse.json(
        {
          error: check.message,
          uploaded: true,
          odb: saved.path,
          id: saved.id,
          size: buf.length,
          hint: "Prefer «Open stage ODB» from the job (no upload). If uploading, restart Next after raising proxyClientMaxBodySize.",
        },
        { status: 422 }
      );
    }

    if (!open) {
      return NextResponse.json({
        ok: true,
        uploaded: true,
        odb: saved.path,
        id: saved.id,
        size: buf.length,
        validated: check.message,
        message: "ODB saved — open with /api/openroad/odb/open",
      });
    }

    const gui = startOpenroadOdbGui(saved.path, owner);
    return NextResponse.json({
      uploaded: true,
      id: saved.id,
      size: buf.length,
      validated: check.message,
      ...gui,
      error: gui.ok ? undefined : gui.message,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "upload failed" },
      { status: 500 }
    );
  }
}
