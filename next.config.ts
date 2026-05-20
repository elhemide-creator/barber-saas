import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack xətasını susdurmaq üçün:
  turbopack: {},
  // Vercel serverlərinin RAM-ı dolub çökməsin deyə (WorkerError həlli):
  experimental: {
    memoryBasedWorkersCount: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [{ module: /node_modules\/node-fetch/ }];
    }
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
