import { useCallback, useState } from 'react';

import { RuntimeSyncConflictError, syncRuntimeSnapshot } from '@/services/runtime-snapshot-service';
import { useBadmintonStore } from '@/lib/badminton-store';
import type { RuntimeSyncPayload } from '@/types/runtime';

export type RuntimeSyncState = 'idle' | 'pending' | 'syncing' | 'synced' | 'error' | 'conflict';

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
    mode: 'FULL',
    players: players.map((player) => ({
      id: player.id,
      status: player.status,
      matchesPlayed: player.matchesPlayed,
      lastCourtNumber: parseCourtNumber(player.lastCourt),
      playerTags: player.playerTags,
      firstArrivedAt: player.firstArrivedAt,
      arrivalBaselineMatches: player.arrivalBaselineMatches,
      fairnessOffset: player.fairnessOffset,
      deferredRounds: player.deferredRounds,
      waitingSince: player.waitingSince,
      entryPriorityConsumedAt: player.entryPriorityConsumedAt,
      lastFinishedAt: player.lastFinishedAt,
      nextMatchRequestedAt: player.nextMatchRequestedAt,
      nextMatchRequestMode: player.nextMatchRequestMode,
      endGameAt: player.endGameAt,
      endGameAfterMatch: player.endGameAfterMatch,
      coupleNumber: player.coupleNumber,
      coupleMatchMode: player.coupleMatchMode
    })),
    courts: courts.map((court) => ({
      courtId: court.id,
      status: court.status,
      startedAt: court.startedAt,
      roster: court.slots
    })),
    nextMatches: nextMatches.map((match) => {
      const persisted = match as typeof match & {
        matchFormat?: RuntimeSyncPayload['nextMatches'][number]['matchFormat'];
        generation?: number;
        manualEdited?: boolean;
        sourceRevision?: number | null;
      };
      return {
        id: match.id,
        queueOrder: match.index,
        roster: match.roster,
        score: match.score,
        locked: match.locked ?? false,
        matchFormat: persisted.matchFormat,
        generation: persisted.generation,
        manualEdited: persisted.manualEdited,
        sourceRevision: persisted.sourceRevision
      };
    })
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
      const response = await syncRuntimeSnapshot(payload);
      useBadmintonStore.setState((current) => ({
        runtimeVersion: response.version,
        nextMatches: current.nextMatches.map((match) => ({ ...match, sourceRevision: response.version })),
        courts: current.courts.map((court) => court.status === 'EMPTY' ? court : { ...court, sourceRevision: response.version })
      }));
      setSyncState('synced');
      return true;
    } catch (error) {
      setSyncState(error instanceof RuntimeSyncConflictError ? 'conflict' : 'error');
      return false;
    }
  }, [enabled, sessionId]);

  const resetSyncState = useCallback(() => setSyncState('idle'), []);

  return { syncState, commitRuntimeSnapshot, resetSyncState };
}
