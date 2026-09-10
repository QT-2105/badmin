import { AsyncLocalStorage } from 'node:async_hooks';

import { AppError } from '@/lib/app-error';

export type TenantContext = Readonly<{
  clubId: string;
  userId?: string;
}>;

const CLUB_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

function logMissingTenant(operation: string, reason: 'missing' | 'invalid' | 'mismatch'): void {
  console.error(JSON.stringify({
    event: 'tenant_context_missing',
    operation,
    reason
  }));
}

function validateContext(input: TenantContext, operation: string): TenantContext {
  if (!CLUB_ID_PATTERN.test(input.clubId) || (input.userId !== undefined && !CLUB_ID_PATTERN.test(input.userId))) {
    logMissingTenant(operation, 'invalid');
    throw new AppError('TenantContext không hợp lệ.', 500);
  }
  return Object.freeze({ clubId: input.clubId, ...(input.userId ? { userId: input.userId } : {}) });
}

export function establishTenantContext(input: TenantContext, operation: string): TenantContext {
  const context = validateContext(input, operation);
  const current = tenantContextStorage.getStore();
  if (current && (current.clubId !== context.clubId || (current.userId && context.userId && current.userId !== context.userId))) {
    logMissingTenant(operation, 'mismatch');
    throw new AppError('TenantContext không thể thay đổi trong cùng request.', 500);
  }
  if (!current) tenantContextStorage.enterWith(context);
  return current ?? context;
}

export function runWithTenantContext<T>(input: TenantContext, operation: string, callback: () => T): T {
  return tenantContextStorage.run(validateContext(input, operation), callback);
}

export function requireTenantContext(operation: string): TenantContext {
  const requestContext = tenantContextStorage.getStore();
  if (requestContext) return requestContext;
  if (process.env.BADMIN_ALLOW_LEGACY_TENANT_FALLBACK !== 'true') {
    logMissingTenant(operation, 'missing');
    throw new AppError('TenantContext chưa được xác lập từ phiên đăng nhập.', 500);
  }
  const clubId = process.env.BADMIN_LEGACY_CLUB_ID?.trim();
  if (!clubId) {
    logMissingTenant(operation, 'missing');
    throw new AppError('Legacy TenantContext compatibility chưa được cấu hình.', 500);
  }
  if (!CLUB_ID_PATTERN.test(clubId)) {
    logMissingTenant(operation, 'invalid');
    throw new AppError('Legacy TenantContext compatibility không hợp lệ.', 500);
  }
  return Object.freeze({ clubId });
}
