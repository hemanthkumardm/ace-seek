import { NextRequest, NextResponse } from "next/server";

export const isVercel =
  process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

export const DEFAULT_EC2_BACKEND_URL = "http://3.90.62.206";

export function getOpenroadBackendUrl(): string {
  const configured = (
    process.env.OPENROAD_API_URL ||
    process.env.DOC_COMPILER_API_URL ||
    process.env.BACKEND_API_URL ||
    process.env.EC2_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL
  )?.replace(/\/$/, "");

  if (configured) return configured;
  if (isVercel) return DEFAULT_EC2_BACKEND_URL;
  return "";
}

export function shouldProxyToBackend(): boolean {
  if (process.env.AIC_FORCE_LOCAL === "1" && !isVercel) return false;
  const backend = getOpenroadBackendUrl();
  return Boolean(backend);
}

export async function proxyOpenroadRequest(
  req: NextRequest,
  pathname: string,
  opts?: {
    ownerId?: string;
    body?: unknown;
    method?: string;
  }
): Promise<NextResponse | null> {
  const backend = getOpenroadBackendUrl();
  if (!backend || (process.env.AIC_FORCE_LOCAL === "1" && !isVercel)) {
    return null;
  }

  try {
    const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const targetUrl = new URL(`${backend}${cleanPath}`);
    req.nextUrl.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v));

    const method = opts?.method || req.method || "GET";
    const headers: Record<string, string> = {};

    const apiKey = req.headers.get("x-api-key");
    if (apiKey) headers["x-api-key"] = apiKey;

    const auth = req.headers.get("authorization");
    if (auth) headers["authorization"] = auth;

    const cookie = req.headers.get("cookie");
    if (cookie) headers["cookie"] = cookie;

    if (opts?.ownerId) {
      headers["x-openroad-owner"] = opts.ownerId;
    } else {
      const ownerHeader = req.headers.get("x-openroad-owner");
      if (ownerHeader) headers["x-openroad-owner"] = ownerHeader;
    }

    let fetchBody: string | undefined;
    if (method !== "GET" && method !== "HEAD") {
      headers["Content-Type"] = "application/json";
      fetchBody =
        opts?.body !== undefined
          ? JSON.stringify(opts.body)
          : await req.text();
    }

    const res = await fetch(targetUrl.toString(), {
      method,
      headers,
      body: fetchBody,
    });

    const isDownload = req.nextUrl.searchParams.get("download");
    if (isDownload) {
      const blob = await res.arrayBuffer();
      const cleanHeaders = new Headers();
      const ct = res.headers.get("content-type");
      const cd = res.headers.get("content-disposition");
      if (ct) cleanHeaders.set("Content-Type", ct);
      if (cd) cleanHeaders.set("Content-Disposition", cd);
      return new NextResponse(new Uint8Array(blob), {
        status: res.status,
        headers: cleanHeaders,
      });
    }

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch (err) {
    if (isVercel) {
      return NextResponse.json(
        {
          ok: false,
          error: `EC2 OpenROAD backend (${backend}) unreachable: ${
            err instanceof Error ? err.message : String(err)
          }. Ensure EC2 is running and ports 80/443 are open in Security Groups.`,
        },
        { status: 503 }
      );
    }
    return null;
  }
}
