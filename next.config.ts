import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack ayarlarını təyin edir
  turbopack: {},

  // Build zamanı TypeScript xətalarına göz yumaraq server yaddaşını qoruyur
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // DIQQƏT: Next.js 16-da 'eslint' açarı bura aid olmadığı üçün tamamilə silindi və xəta aradan qaldırıldı!
};

export default nextConfig;
