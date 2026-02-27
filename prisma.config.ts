import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const datasourceUrl =
  process.env.MIGRATE_DATABASE_URL ??
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --import tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl ?? env("DATABASE_URL"),
  },
});
