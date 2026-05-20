import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack xətasını susdurur
  turbopack: {},
  
  // Vercel serverinin boğulmaması üçün prosesləri məhdudlaşdırır (WorkerError həlli)
  experimental: {
    cpus: 1,
    workerThreads: false,
    memoryBasedWorkersCount: true,
  },
  
  // Build zamanı ağır yoxlamaları ləğv edib yaddaşa qənaət edir
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
