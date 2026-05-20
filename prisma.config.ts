import { defineConfig } from "prisma/config";

// DIQQƏT: "dotenv/config" idxalı Vercel-də __dirname xətası verdiyi üçün tamamilə silindi.
// Next.js onsuz da .env məlumatlarını özü avtomatik oxuyur.

export default defineConfig({
  schema: "prisma/schema.prisma",
});
