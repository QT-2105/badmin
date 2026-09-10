import { createHash } from 'crypto';

import { AppError } from '@/lib/app-error';
import { classifyLoginIdentifier } from './identifiers';

type LoginAttempt = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, LoginAttempt>();

export function getLoginRateLimitKey(request: Request, clubId: string, identifier: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || request.headers.get('x-real-ip') || 'unknown';
  let canonicalIdentifier: string;
  try {
    const classified = classifyLoginIdentifier(identifier);
    canonicalIdentifier = `${classified.kind}:${classified.normalized}`;
  } catch {
    canonicalIdentifier = `invalid:${identifier.normalize('NFKC').trim().toLowerCase()}`;
  }
  const identityHash = createHash('sha256')
    .update(`${clubId}:${canonicalIdentifier}`)
    .digest('hex');
  return `${ip}:${identityHash}`;
}

export function assertLoginAllowed(key: string): void {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return;
  }
  if (current.count >= MAX_ATTEMPTS) {
    const retryMinutes = Math.max(1, Math.ceil((current.resetAt - now) / 60_000));
    throw new AppError(`Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau khoảng ${retryMinutes} phút.`, 429);
  }
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  attempts.set(key, { ...current, count: current.count + 1 });
}

export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}
