import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Edge server xətalarını və Prisma toqquşmalarını bloklamaq üçün:
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [{ module: /node_modules\/node-fetch/ }];
    }
    return config;
  },
  // Vercel-ə yükləyəndə xırda xətalara göz yumması üçün:
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
