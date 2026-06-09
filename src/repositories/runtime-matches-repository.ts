import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import type { RuntimeMatch } from '@/types/runtime';
import { resolveRuntimeSessionId } from './runtime-session-repository';

function parseDateValue(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function extractPlayerId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const candidate = record.player_id ?? record.playerId ?? record.id ?? record.session_player_id ?? record.sessionPlayerId;
    if (typeof candidate === 'string') return candidate;
  }
  return null;
}

function parseTeam(value: Prisma.JsonValue): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => extractPlayerId(item))
      .filter((item): item is string => Boolean(item));
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const players = record.players;
    if (Array.isArray(players)) {
      return players
        .map((item) => extractPlayerId(item))
        .filter((item): item is string => Boolean(item));
    }
  }
  return [];
}

export async function listRuntimeMatches(sessionId?: string): Promise<RuntimeMatch[]> {
  const resolvedSessionId = await resolveRuntimeSessionId(sessionId);
  if (!resolvedSessionId) return [];

  const rows = await prisma.runtime_matches.findMany({
    where: { session_id: resolvedSessionId },
    orderBy: [{ queue_order: 'asc' }, { created_at: 'asc' }]
  });

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    queueOrder: row.queue_order ?? null,
    courtId: row.court_number ? `c${row.court_number}` : null,
    status: row.status,
    fairnessScore: row.fairness_score ?? null,
    teamA: parseTeam(row.team_a),
    teamB: parseTeam(row.team_b),
    createdAt: parseDateValue(row.created_at),
    updatedAt: parseDateValue(row.updated_at)
  }));
}
