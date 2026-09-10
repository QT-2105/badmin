import { createHash, randomBytes } from 'crypto';

import { normalizeAuthIdentifiers } from '@/lib/auth/identifiers';
import { ENTITLEMENT_FEATURE_KEYS, type EntitlementFeatureKey } from '@/lib/entitlements/types';

const CLUB_CODE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/;

export type TenantProvisioningContract = {
  idempotencyKey: string;
  clubId: string;
  clubCode: string;
  clubName: string;
  owner: {
    username: string | null;
    usernameNormalized: string | null;
    email: string | null;
    emailNormalized: string | null;
    phone: string | null;
    phoneNormalized: string | null;
    displayName: string;
  };
  features: Partial<Record<EntitlementFeatureKey, boolean>>;
  limits: Record<string, number>;
  activationTokenHash: string;
  activationExpiresAt: string;
};

export function normalizeClubCode(value: string): string {
  return value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 50)
    .replace(/-+$/g, '');
}

export function assertClubCode(value: string): string {
  const code = normalizeClubCode(value);
  if (!CLUB_CODE_PATTERN.test(code)) throw new Error('Mã CLB cần từ 3-50 ký tự chữ thường, số hoặc dấu gạch ngang.');
  return code;
}

export function createClubCodeCandidates(
  clubName: string,
  areaName?: string | null,
  randomNumber = Math.floor(1000 + Math.random() * 9000)
): string[] {
  const base = assertClubCode(clubName);
  const area = areaName ? normalizeClubCode(areaName) : '';
  return [...new Set([
    base,
    ...(area ? [`${base}-${area}`.slice(0, 50).replace(/-+$/g, '')] : []),
    `${base.slice(0, 45).replace(/-+$/g, '')}-${randomNumber}`
  ])];
}

export function createActivationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashActivationToken(token) };
}

export function hashActivationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function validateProvisioningContract(input: TenantProvisioningContract): TenantProvisioningContract {
  if (!isUuid(input.idempotencyKey) || !isUuid(input.clubId)) throw new Error('Định danh provisioning không hợp lệ.');
  const clubName = input.clubName.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (!clubName || clubName.length > 255) throw new Error('Tên CLB không hợp lệ.');
  const displayName = input.owner.displayName.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (!displayName || displayName.length > 255) throw new Error('Tên OWNER không hợp lệ.');
  const identifiers = normalizeAuthIdentifiers(input.owner);
  if (!/^[a-f0-9]{64}$/.test(input.activationTokenHash)) throw new Error('Activation token hash không hợp lệ.');
  const expiresAt = new Date(input.activationExpiresAt);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    throw new Error('Thời hạn kích hoạt không hợp lệ.');
  }
  const allowedFeatures = new Set<string>(ENTITLEMENT_FEATURE_KEYS);
  for (const [key, value] of Object.entries(input.features)) {
    if (!allowedFeatures.has(key) || typeof value !== 'boolean') throw new Error(`Feature provisioning không hợp lệ: ${key}`);
  }
  for (const [key, value] of Object.entries(input.limits)) {
    if (!key || !Number.isFinite(value) || value < 0) throw new Error(`Limit provisioning không hợp lệ: ${key || '(empty)'}`);
  }
  return {
    ...input,
    clubCode: assertClubCode(input.clubCode),
    clubName,
    owner: { ...identifiers, displayName },
    activationExpiresAt: expiresAt.toISOString()
  };
}

export function provisioningFingerprint(input: TenantProvisioningContract): string {
  const value = validateProvisioningContract(input);
  return createHash('sha256').update(JSON.stringify({
    clubId: value.clubId,
    clubCode: value.clubCode,
    clubName: value.clubName,
    owner: value.owner,
    features: value.features,
    limits: value.limits,
    activationTokenHash: value.activationTokenHash,
    activationExpiresAt: value.activationExpiresAt
  })).digest('hex');
}

export function buildRegistrationEmail(input: {
  clubName: string;
  clubCode: string;
  activationBaseUrl: string;
  activationToken: string;
}): { subject: string; text: string; html: string } {
  const clubCode = assertClubCode(input.clubCode);
  const activationUrl = `${input.activationBaseUrl.replace(/\/$/, '')}?club=${encodeURIComponent(clubCode)}#token=${encodeURIComponent(input.activationToken)}`;
  return {
    subject: `Kích hoạt tài khoản quản lý ${input.clubName}`,
    text: [
      `CLB ${input.clubName} đã được đăng ký.`,
      `*** MÃ CLB ĐĂNG NHẬP: ${clubCode} ***`,
      'Hãy lưu mã CLB này để phân biệt và đăng nhập hệ thống.',
      `Tạo mật khẩu OWNER tại: ${activationUrl}`,
      'Hệ thống không gửi hoặc lưu mật khẩu plaintext trong email.'
    ].join('\n\n'),
    html: `<p>CLB ${escapeHtml(input.clubName)} đã được đăng ký.</p><p><strong>MÃ CLB ĐĂNG NHẬP: ${escapeHtml(clubCode)}</strong></p><p>Hãy lưu mã CLB này để phân biệt và đăng nhập hệ thống.</p><p><a href="${escapeHtml(activationUrl)}">Tạo mật khẩu OWNER</a></p><p>Hệ thống không gửi hoặc lưu mật khẩu plaintext trong email.</p>`
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]!);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
