import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack ayarlarını standartlaşdırır
  turbopack: {},

  // Build zamanı TypeScript və ESLint xətalarını keçərək yaddaşı qoruyur
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
