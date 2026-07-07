import { AppError } from '@/lib/app-error';

type LoginAttempt = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, LoginAttempt>();

export function getLoginRateLimitKey(request: Request, email: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || request.headers.get('x-real-ip') || 'unknown';
  return `${ip}:${email.trim().toLowerCase()}`;
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
