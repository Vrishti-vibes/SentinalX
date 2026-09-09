import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Checks if the PostgreSQL / Supabase database connection string is configured
 * and not just an empty string or standard placeholder.
 */
export const isDatabaseConfigured: boolean = Boolean(
  process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes("[project-ref]") &&
    !process.env.DATABASE_URL.includes("[password]") &&
    process.env.DATABASE_URL.trim() !== ""
);

export const isDbConfigured = isDatabaseConfigured;

/**
 * Singleton PrismaClient for Next.js hot-reloading in dev mode
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Performs an actual runtime health probe against the database.
 * Returns true only if a real SELECT 1 query succeeds.
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  type: string;
  orm: string;
  error?: string;
}> {
  if (!isDatabaseConfigured) {
    return {
      connected: false,
      type: "Supabase PostgreSQL",
      orm: "Prisma",
      error: "DATABASE NOT CONFIGURED (Missing valid DATABASE_URL in environment)",
    };
  }

  try {
    // 3-second timeout probe
    const probePromise = prisma.$queryRawUnsafe("SELECT 1;");
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection probe timed out after 3000ms")), 3000)
    );

    await Promise.race([probePromise, timeoutPromise]);

    return {
      connected: true,
      type: "Supabase PostgreSQL",
      orm: "Prisma",
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      type: "Supabase PostgreSQL",
      orm: "Prisma",
      error: errMsg,
    };
  }
}
