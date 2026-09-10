import { PrismaClient } from '@prisma/client';

export function buildRuntimeDatabaseUrl(databaseUrl: string, runtimeRole?: string) {
  const role = runtimeRole?.trim();
  if (!role) return databaseUrl;
  if (!/^[a-z_][a-z0-9_]*$/.test(role)) {
    throw new Error('BADMIN_RUNTIME_DB_ROLE không hợp lệ.');
  }

  const url = new URL(databaseUrl);
  const currentOptions = url.searchParams.get('options')?.trim();
  if (currentOptions && /(?:^|\s)-c\s+role=/.test(currentOptions)) {
    throw new Error('DATABASE_URL đã cấu hình runtime role; không được khai báo trùng.');
  }
  url.searchParams.set('options', [currentOptions, `-c role=${role}`].filter(Boolean).join(' '));
  return url.toString();
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: process.env.BADMIN_RUNTIME_DB_ROLE
      ? {
          db: {
            url: buildRuntimeDatabaseUrl(
              process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '',
              process.env.BADMIN_RUNTIME_DB_ROLE
            )
          }
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
