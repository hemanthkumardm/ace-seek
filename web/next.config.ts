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
};

export default nextConfig;
