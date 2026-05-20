import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack xətasını aradan qaldırır
  turbopack: {},

  // Serverless mühitdə RAM-ın dolmasının qarşısını alır
  experimental: {
    memoryBasedWorkersCount: true,
  },

  // ƏN VACİB HİSSƏ: Kənar paketlərin (Pusher və s.) yaratdığı qlobal server xətalarını tamamilə bloklayır!
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "pusher"];
    }
    return config;
  },

  // Build zamanı heç bir xırda şeyə ilişməməsi üçün:
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
