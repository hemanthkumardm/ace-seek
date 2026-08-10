import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
