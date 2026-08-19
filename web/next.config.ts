import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
