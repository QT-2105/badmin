import { prisma } from '@/lib/prisma';
import type { RuntimeGender, RuntimePlayerStatus, RuntimeSession, RuntimeSessionPlayer } from '@/types/runtime';

function parseDateValue(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeGender(value: string | null | undefined): RuntimeGender {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'female' || raw === 'f' || raw === 'nu' || raw === 'nữ') return 'Nữ';
  return 'Nam';
}

function normalizeStatus(value: string | null | undefined): RuntimePlayerStatus {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'JUST_FINISHED' || raw === 'JUSTFINISHED') return 'JUST_FINISHED';
  if (raw === 'PLAYING') return 'PLAYING';
  if (raw === 'RESTING') return 'RESTING';
  if (raw === 'PRIORITY') return 'PRIORITY';
  if (raw === 'FINISHED') return 'FINISHED';
  return 'WAITING';
}

export async function resolveRuntimeSessionId(sessionId?: string): Promise<string | null> {
  if (sessionId) return sessionId;

  const activeSession = await prisma.play_sessions.findFirst({
    where: { status: { in: ['ACTIVE', 'LIVE', 'IN_PROGRESS'] } },
    orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }]
  });

  if (activeSession?.id) return activeSession.id;

  const fallbackSession = await prisma.play_sessions.findFirst({
    orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }]
  });

  return fallbackSession?.id ?? null;
}

export async function getRuntimeSession(sessionId?: string): Promise<RuntimeSession | null> {
  const resolvedSessionId = await resolveRuntimeSessionId(sessionId);
  if (!resolvedSessionId) return null;

  const session = await prisma.play_sessions.findUnique({
    where: { id: resolvedSessionId }
  });

  if (!session) return null;

  return {
    id: session.id,
    name: session.name,
    startTime: session.start_time.toISOString(),
    endTime: session.end_time.toISOString(),
    courtCount: session.court_count,
    status: session.status
  };
}

export async function listSessionPlayers(sessionId: string): Promise<RuntimeSessionPlayer[]> {
  const rows = await prisma.session_players.findMany({
    where: { session_id: sessionId },
    orderBy: [{ joined_at: 'asc' }]
  });

  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    gender: normalizeGender(row.gender),
    level: row.level,
    totalMatches: row.total_matches,
    paymentAmount: Number(row.payment_amount ?? 0),
    discount: Number(row.discount ?? 0),
    paymentMethod: row.payment_method ?? null,
    paymentStatus: row.payment_status,
    runtimeStatus: normalizeStatus(row.runtime_status),
    lastCourtNumber: row.last_court_number ?? null,
    note: row.note ?? null,
    joinedAt: parseDateValue(row.joined_at)
  }));
}
