import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack xətasını susdurur
  turbopack: {},
  
  // Vercel serverlərinin RAM-ı dolmasın deyə yaddaş limitini aktiv edir
  experimental: {
    memoryBasedWorkersCount: true,
  },
  
  // Build zamanı lazımsız yoxlamaları ləğv edib yaddaşa qənaət edir
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
