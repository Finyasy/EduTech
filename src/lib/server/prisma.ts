import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as typeof globalThis & {
  prisma?: PrismaClient;
  prismaPool?: Pool;
};

let _client: PrismaClient | null = null;

function isPlaceholderDatabaseUrl(url: string): boolean {
  return url.includes("HOST") || url.includes("USER:PASSWORD");
}

function loadPrisma(): PrismaClient | null {
  if (_client !== null) return _client;
  const url = process.env.DATABASE_URL;
  if (!url || url.trim() === "" || isPlaceholderDatabaseUrl(url)) return null;
  try {
    const pool =
      globalForPrisma.prismaPool ??
      new Pool({
        connectionString: url,
      });
    const adapter = new PrismaPg(pool);
    _client =
      globalForPrisma.prisma ??
      new PrismaClient({
        adapter,
        log: ["error", "warn"],
      });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = _client;
      globalForPrisma.prismaPool = pool;
    }
    return _client;
  } catch {
    return null;
  }
}

/**
 * Returns PrismaClient when DATABASE_URL is set and the client has been generated
 * (e.g. after `pnpm prisma generate`). Otherwise returns null so the app can
 * use mock data or return 501 without crashing.
 */
export function getPrisma(): PrismaClient | null {
  return loadPrisma();
}
