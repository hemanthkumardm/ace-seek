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
    const toolsSeo = [
      "doc-compiler",
      "diff-comparator",
      "table-builder",
      "format-converter",
      "tex-formatter",
    ] as const;

    return [
      { source: "/docs", destination: "/vlsi/learn", permanent: true },
      { source: "/docs/:path*", destination: "/vlsi/learn", permanent: true },
      { source: "/compiler", destination: "https://www.ace-seek.com/tools/doc-compiler", permanent: true },
      { source: "/tools/md-to-pdf", destination: "/tools/doc-compiler", permanent: true },
      { source: "/tools/md-to-pdf/:path*", destination: "/tools/doc-compiler/:path*", permanent: true },
      // Old bookmark / GSC URL — tool never lived under /tools/sdc-calculator
      { source: "/sdc-calculator", destination: "/vlsi/sdc-studio", permanent: true },
      { source: "/tools/sdc-calculator", destination: "/vlsi/sdc-studio", permanent: true },
      { source: "/tools/sdc-calculator/:path*", destination: "/vlsi/sdc-studio", permanent: true },
      { source: "/script-helper", destination: "/tools/script-helper", permanent: true },
      // Crawlers still request /favicon.ico; site icon is SVG
      { source: "/favicon.ico", destination: "/icon.svg", permanent: false },
      // Legal aliases → short canonical paths
      {
        source: "/terms-and-conditions",
        destination: "/terms",
        permanent: true,
      },
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: true,
      },
      // SEO: apex → www
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "ace-seek.com" }],
        destination: "https://www.ace-seek.com/:path*",
        permanent: true as const,
      },
      // SEO: tools host duplicates → www canonical for the five GSC URLs
      ...toolsSeo.flatMap((slug) => [
        {
          source: `/tools/${slug}`,
          has: [{ type: "host" as const, value: "tools.ace-seek.com" }],
          destination: `https://www.ace-seek.com/tools/${slug}`,
          permanent: true as const,
        },
        {
          source: `/tools/${slug}/`,
          has: [{ type: "host" as const, value: "tools.ace-seek.com" }],
          destination: `https://www.ace-seek.com/tools/${slug}`,
          permanent: true as const,
        },
      ]),
    ];
  },
  async headers() {
    const toolsSeo = [
      "doc-compiler",
      "diff-comparator",
      "table-builder",
      "format-converter",
      "tex-formatter",
    ] as const;
    const pageCanonicals = [
      ["blog", "https://www.ace-seek.com/blog"],
      ["offers", "https://www.ace-seek.com/offers"],
      ["openroad", "https://www.ace-seek.com/openroad"],
      ["privacy", "https://www.ace-seek.com/privacy"],
      ["terms", "https://www.ace-seek.com/terms"],
    ] as const;
    return [
      ...toolsSeo.map((slug) => ({
        source: `/tools/${slug}`,
        headers: [
          {
            key: "Link",
            value: `<https://www.ace-seek.com/tools/${slug}>; rel="canonical"`,
          },
        ],
      })),
      ...pageCanonicals.map(([path, url]) => ({
        source: `/${path}`,
        headers: [
          {
            key: "Link",
            value: `<${url}>; rel="canonical"`,
          },
        ],
      })),
      // Never index Next.js static assets (GSC crawled a .woff2)
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
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
