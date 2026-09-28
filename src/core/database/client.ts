import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
const globalDb = globalThis as unknown as { tomvisDb?: PrismaClient };
export function db() {
  if (!globalDb.tomvisDb) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
    const url = new URL(process.env.DATABASE_URL);
    globalDb.tomvisDb = new PrismaClient({
      adapter: new PrismaMariaDb({
        host: url.hostname,
        port: Number(url.port || 3306),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.slice(1),
        connectionLimit: 5,
        ...(url.searchParams.get("ssl") === "true"
          ? { ssl: { rejectUnauthorized: true } }
          : {}),
      }),
    });
  }
  return globalDb.tomvisDb;
}
