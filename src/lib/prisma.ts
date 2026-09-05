import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Execute database queries within a tenant-scoped PostgreSQL transaction.
 * Injects app.current_agency_id into PostgreSQL transaction context for RLS enforcement.
 */
export async function withTenantContext<T>(
  agencyId: string,
  fn: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Set PostgreSQL local session setting for RLS policies
    if (agencyId) {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_agency_id = '${agencyId}'`);
    }
    return await fn(tx as unknown as Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">);
  });
}

