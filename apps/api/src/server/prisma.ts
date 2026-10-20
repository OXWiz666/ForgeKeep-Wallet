import "server-only";
import { PrismaClient } from "@prisma/client";
import { serverEnv } from "./env.js";

const globalPrisma = globalThis as typeof globalThis & { forgekeepPrisma?: PrismaClient };
export function getPrisma(): PrismaClient {
  globalPrisma.forgekeepPrisma ??= new PrismaClient({ datasources: { db: { url: serverEnv("DATABASE_URL") } } });
  return globalPrisma.forgekeepPrisma;
}
