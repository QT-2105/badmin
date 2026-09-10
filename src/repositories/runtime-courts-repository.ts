import { prisma } from '@/lib/prisma';
import type { RuntimeCourt, RuntimeCourtStatus } from '@/types/runtime';
import { resolveRuntimeSessionId } from './runtime-session-repository';
import { requireTenantContext } from '@/lib/tenant-context';

function normalizeCourtStatus(value: string | null | undefined): RuntimeCourtStatus {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'PLAYING') return 'PLAYING';
  if (raw === 'READY') return 'READY';
  return 'EMPTY';
}

function parseDateValue(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

export async function listRuntimeCourts(sessionId?: string): Promise<RuntimeCourt[]> {
  const resolvedSessionId = await resolveRuntimeSessionId(sessionId);
  if (!resolvedSessionId) return [];
  const { clubId } = requireTenantContext('runtime_court.list');

  const rows = await prisma.runtime_courts.findMany({
    where: { session_id: resolvedSessionId, club_id: clubId },
    orderBy: [{ court_number: 'asc' }]
  });

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    courtId: `c${row.court_number}`,
    courtName: `Sân ${row.court_number}`,
    status: normalizeCourtStatus(row.status),
    runtimeMatchId: row.runtime_match_id ?? null,
    startedAt: parseDateValue(row.started_at),
    updatedAt: parseDateValue(row.updated_at)
  }));
}

export async function listSessionCourtsAsRuntime(sessionId: string): Promise<RuntimeCourt[]> {
  const { clubId } = requireTenantContext('runtime_court.session_projection');
  const session = await prisma.play_sessions.findUnique({
    where: { id: sessionId, club_id: clubId },
    select: { court_count: true }
  });
  const courtCount = Math.max(0, session?.court_count ?? 0);

  return Array.from({ length: courtCount }, (_, index) => ({
    id: `runtime-empty-${sessionId}-${index + 1}`,
    sessionId,
    courtId: `c${index + 1}`,
    courtName: `Sân ${index + 1}`,
    status: 'EMPTY',
    runtimeMatchId: null,
    startedAt: null,
    updatedAt: null
  }));
}
