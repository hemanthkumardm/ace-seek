import os from "os";
import type { NextConfig } from "next";

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
  // Let phones / other LAN devices load /_next chunks in `next dev -H 0.0.0.0`
  allowedDevOrigins: lanDevOrigins(),
  // Large markdown uploads + long Docker/TeX compiles
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
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
