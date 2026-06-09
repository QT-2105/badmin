import { useCallback, useState } from 'react';

import { syncRuntimeSnapshot } from '@/services/runtime-snapshot-service';
import { useBadmintonStore } from '@/lib/badminton-store';
import type { RuntimeSyncPayload } from '@/types/runtime';

export type RuntimeSyncState = 'idle' | 'pending' | 'syncing' | 'synced' | 'error';

function parseCourtNumber(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function buildSyncPayload(
  sessionId: string,
  players: ReturnType<typeof useBadmintonStore.getState>['players'],
  courts: ReturnType<typeof useBadmintonStore.getState>['courts'],
  nextMatches: ReturnType<typeof useBadmintonStore.getState>['nextMatches']
): RuntimeSyncPayload {
  return {
    sessionId,
    players: players.map((player) => ({
      id: player.id,
      status: player.status,
      matchesPlayed: player.matchesPlayed,
      lastCourtNumber: parseCourtNumber(player.lastCourt)
    })),
    courts: courts.map((court) => ({
      courtId: court.id,
      status: court.status,
      startedAt: court.startedAt,
      roster: court.slots
    })),
    nextMatches: nextMatches.map((match) => ({
      queueOrder: match.index,
      roster: match.roster,
      score: match.score
    }))
  };
}

export function useRuntimeSync({ enabled = true }: { enabled?: boolean } = {}) {
  const sessionId = useBadmintonStore((state) => state.runtimeSessionId);
  const [syncState, setSyncState] = useState<RuntimeSyncState>('idle');

  const commitRuntimeSnapshot = useCallback(async (): Promise<boolean> => {
    if (!enabled || !sessionId) {
      setSyncState('idle');
      return false;
    }

    const state = useBadmintonStore.getState();
    const payload = buildSyncPayload(sessionId, state.players, state.courts, state.nextMatches);

    setSyncState('syncing');
    try {
      await syncRuntimeSnapshot(payload);
      setSyncState('synced');
      return true;
    } catch {
      setSyncState('error');
      return false;
    }
  }, [enabled, sessionId]);

  return { syncState, commitRuntimeSnapshot };
}
