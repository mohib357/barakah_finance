// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Prisma Client Singleton
//
//  Key points:
//  • Uses globalThis to reuse the same instance across HMR
//  • @prisma/client is externalized in next.config.mjs so
//    webpack doesn't bundle it (prevents build-time init)
//  • All enums imported from "@prisma/client" now work because
//    `prisma generate` has been run with the correct schema
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

const prisma = global._prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global._prisma = prisma;
}

export { prisma };
export default prisma;
