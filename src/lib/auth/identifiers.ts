import { AppError } from '@/lib/app-error';

const USERNAME_PATTERN = /^[\p{L}\p{N}._-]+$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_INPUT_PATTERN = /^[+\d\s().-]+$/;

export type AuthIdentifiers = {
  username: string | null;
  usernameNormalized: string | null;
  email: string | null;
  emailNormalized: string | null;
  phone: string | null;
  phoneNormalized: string | null;
};

export type ClassifiedLoginIdentifier =
  | { kind: 'email'; normalized: string }
  | { kind: 'phone'; normalized: string }
  | { kind: 'username'; normalized: string };

function normalizeUnicode(value: unknown): string {
  return String(value ?? '').normalize('NFKC').trim();
}

export function normalizeUsername(value: unknown): { value: string; normalized: string } | null {
  const raw = normalizeUnicode(value);
  if (!raw) return null;
  if (raw.length < 3 || raw.length > 80 || !USERNAME_PATTERN.test(raw) || /^\d+$/.test(raw)) {
    throw new AppError('Username cần từ 3-80 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.', 400);
  }
  return { value: raw, normalized: raw.toLocaleLowerCase('vi-VN') };
}

export function normalizeEmail(value: unknown): { value: string; normalized: string } | null {
  const raw = normalizeUnicode(value);
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  if (normalized.length > 320 || !EMAIL_PATTERN.test(normalized)) {
    throw new AppError('Email không hợp lệ.', 400);
  }
  return { value: normalized, normalized };
}

export function normalizePhone(value: unknown): { value: string; normalized: string } | null {
  const raw = normalizeUnicode(value);
  if (!raw) return null;
  if (!PHONE_INPUT_PATTERN.test(raw)) throw new AppError('Số điện thoại không hợp lệ.', 400);
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length >= 11 && digits.length <= 12) digits = `0${digits.slice(2)}`;
  if (digits.length < 9 || digits.length > 15) throw new AppError('Số điện thoại không hợp lệ.', 400);
  return { value: raw, normalized: digits };
}

export function normalizeAuthIdentifiers(input: {
  username?: unknown;
  email?: unknown;
  phone?: unknown;
  legacyLogin?: unknown;
}): AuthIdentifiers {
  let usernameInput = input.username;
  let emailInput = input.email;
  let phoneInput = input.phone;

  if (!normalizeUnicode(usernameInput) && !normalizeUnicode(emailInput) && !normalizeUnicode(phoneInput)) {
    const legacy = normalizeUnicode(input.legacyLogin);
    if (legacy) {
      const classified = classifyLoginIdentifier(legacy);
      if (classified.kind === 'email') emailInput = legacy;
      else if (classified.kind === 'phone') phoneInput = legacy;
      else usernameInput = legacy;
    }
  }

  const username = normalizeUsername(usernameInput);
  const email = normalizeEmail(emailInput);
  const phone = normalizePhone(phoneInput);
  if (!username && !email && !phone) {
    throw new AppError('Cần nhập ít nhất username, email hoặc số điện thoại.', 400);
  }

  return {
    username: username?.value ?? null,
    usernameNormalized: username?.normalized ?? null,
    email: email?.value ?? null,
    emailNormalized: email?.normalized ?? null,
    phone: phone?.value ?? null,
    phoneNormalized: phone?.normalized ?? null
  };
}

export function classifyLoginIdentifier(value: unknown): ClassifiedLoginIdentifier {
  const raw = normalizeUnicode(value);
  if (!raw) throw new AppError('Vui lòng nhập thông tin đăng nhập.', 400);
  if (raw.includes('@')) {
    const email = normalizeEmail(raw);
    if (!email) throw new AppError('Thông tin đăng nhập không hợp lệ.', 400);
    return { kind: 'email', normalized: email.normalized };
  }
  if (PHONE_INPUT_PATTERN.test(raw) && raw.replace(/\D/g, '').length >= 9) {
    const phone = normalizePhone(raw);
    if (!phone) throw new AppError('Thông tin đăng nhập không hợp lệ.', 400);
    return { kind: 'phone', normalized: phone.normalized };
  }
  const username = normalizeUsername(raw);
  if (!username) throw new AppError('Thông tin đăng nhập không hợp lệ.', 400);
  return { kind: 'username', normalized: username.normalized };
}

export function authIdentifierLabel(input: { username?: string | null; email?: string | null; phone?: string | null }): string {
  return input.username || input.email || input.phone || '';
}
