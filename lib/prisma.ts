const { PrismaClient } = require('@prisma/client') as {
  PrismaClient: new (options?: { log?: string[] }) => any;
};

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: any;
};

export const prisma =
  process.env.DATABASE_URL
    ? globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
      })
    : null;

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}
