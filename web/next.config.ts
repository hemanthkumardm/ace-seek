import os from "os";
import type { NextConfig } from "next";
import path from "path";

function lanDevOrigins(): string[] {
  const hosts = new Set(["localhost", "127.0.0.1"]);
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === "IPv4" && !a.internal) hosts.add(a.address);
    }
  }
  return [...hosts];
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  // Let phones / other LAN devices load /_next chunks in `next dev -H 0.0.0.0`
  allowedDevOrigins: lanDevOrigins(),
  // Large markdown uploads + OpenROAD ODB (10–100MB+) + Docker/TeX compiles
  experimental: {
    serverActions: {
      bodySizeLimit: "512mb",
    },
    /**
     * CRITICAL: default proxy body buffer is 10MB. Larger ODB uploads were
     * silently truncated → OpenROAD ORD-0054 "odb file is invalid".
     * (CTS/placement ODBs are often 12–80MB.)
     */
    proxyClientMaxBodySize: "512mb",
  },
  // Avoid bundling issues with child_process paths
  serverExternalPackages: [],
  async redirects() {
    return [
      { source: "/compiler", destination: "/tools/doc-compiler", permanent: true },
      { source: "/tools/md-to-pdf", destination: "/tools/doc-compiler", permanent: true },
      { source: "/tools/md-to-pdf/:path*", destination: "/tools/doc-compiler/:path*", permanent: true },
      { source: "/sdc-calculator", destination: "/tools/sdc-calculator", permanent: true },
      { source: "/script-helper", destination: "/tools/script-helper", permanent: true },
    ];
  },
  async rewrites() {
    const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
    const externalBackendUrl = (
      process.env.OPENROAD_API_URL ||
      process.env.DOC_COMPILER_API_URL ||
      process.env.BACKEND_API_URL ||
      process.env.EC2_BACKEND_URL ||
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      (isVercel ? "http://3.90.62.206" : "")
    )?.replace(/\/$/, "");
    if (externalBackendUrl && !process.env.AIC_FORCE_LOCAL) {
      return {
        beforeFiles: [
          {
            source: "/api/openroad/:path*",
            destination: `${externalBackendUrl}/api/openroad/:path*`,
          },
        ],
        afterFiles: [],
        fallback: [],
      };
    }
    return [];
  },
};

export default nextConfig;
