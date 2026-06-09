export type OperationalSessionStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export function normalizeSessionStatus(status: string | null | undefined): OperationalSessionStatus {
  const raw = String(status ?? '').trim().toUpperCase();
  if (raw === 'ACTIVE' || raw === 'LIVE' || raw === 'IN_PROGRESS') return 'ACTIVE';
  if (raw === 'COMPLETED' || raw === 'FINISHED') return 'COMPLETED';
  if (raw === 'CANCELLED') return 'CANCELLED';
  return 'PENDING';
}

export function toDatabaseSessionStatus(status: string | null | undefined): 'NOT_STARTED' | 'LIVE' | 'FINISHED' {
  const normalized = normalizeSessionStatus(status);
  if (normalized === 'ACTIVE') return 'LIVE';
  if (normalized === 'COMPLETED') return 'FINISHED';
  return 'NOT_STARTED';
}

export function getSessionStatusLabel(status: string | null | undefined): string {
  const normalized = normalizeSessionStatus(status);
  if (normalized === 'ACTIVE') return 'Đang điều phối';
  if (normalized === 'COMPLETED') return 'Đã hoàn tất';
  if (normalized === 'CANCELLED') return 'Đã hủy';
  return 'Chờ bắt đầu';
}

export function isRuntimeActiveStatus(status: string | null | undefined): boolean {
  return normalizeSessionStatus(status) === 'ACTIVE';
}

export function isRuntimeReadonlyStatus(status: string | null | undefined): boolean {
  const normalized = normalizeSessionStatus(status);
  return normalized === 'COMPLETED' || normalized === 'CANCELLED';
}
