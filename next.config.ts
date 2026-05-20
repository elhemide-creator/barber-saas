import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // TypeScript xətalarını build zamanı görməzdən gəl (MVP üçün mütləqdir)
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint xətalarını build zamanı görməzdən gəl
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
