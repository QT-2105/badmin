import { prisma } from '@/lib/prisma';
import type { RuntimeSnapshot, RuntimeSyncPayload } from '@/types/runtime';
import { listRuntimeCourts, listSessionCourtsAsRuntime } from './runtime-courts-repository';
import { listRuntimeMatches } from './runtime-matches-repository';
import { getRuntimeSession, listSessionPlayers, resolveRuntimeSessionId } from './runtime-session-repository';

function rosterToTeams(roster: Array<string | null>) {
  const clean = roster.filter((value): value is string => Boolean(value));
  return {
    teamA: clean.slice(0, 2),
    teamB: clean.slice(2, 4)
  };
}

function parseCourtNumber(courtId: string): number {
  const match = courtId.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export async function getRuntimeSnapshot(sessionId?: string): Promise<RuntimeSnapshot> {
  const resolvedSessionId = await resolveRuntimeSessionId(sessionId);
  if (!resolvedSessionId) {
    return { session: null, players: [], courts: [], matches: [] };
  }

  const [session, players, runtimeCourts, matches] = await Promise.all([
    getRuntimeSession(resolvedSessionId),
    listSessionPlayers(resolvedSessionId),
    listRuntimeCourts(resolvedSessionId),
    listRuntimeMatches(resolvedSessionId)
  ]);

  const courts = runtimeCourts.length > 0 ? runtimeCourts : await listSessionCourtsAsRuntime(resolvedSessionId);

  return {
    session,
    players,
    courts,
    matches
  };
}

export async function syncRuntimeSnapshot(payload: RuntimeSyncPayload): Promise<void> {
  const { sessionId } = payload;

  await prisma.$transaction(async (tx) => {
    for (const player of payload.players) {
      await tx.session_players.updateMany({
        where: { id: player.id, session_id: sessionId },
        data: {
          runtime_status: player.status,
          total_matches: player.matchesPlayed,
          last_court_number: player.lastCourtNumber
        }
      });
    }

    const existingQueueMatches = await tx.runtime_matches.findMany({
      where: { session_id: sessionId, court_number: null, queue_order: { not: null } }
    });
    const existingByOrder = new Map(existingQueueMatches.map((match) => [match.queue_order ?? -1, match]));
    const queueOrders = payload.nextMatches.map((match) => match.queueOrder);

    for (const queueMatch of payload.nextMatches) {
      const existing = existingByOrder.get(queueMatch.queueOrder);
      const { teamA, teamB } = rosterToTeams(queueMatch.roster);

      if (existing) {
        await tx.runtime_matches.update({
          where: { id: existing.id },
          data: {
            status: 'READY',
            team_a: teamA,
            team_b: teamB,
            fairness_score: queueMatch.score ?? existing.fairness_score,
            queue_order: queueMatch.queueOrder
          }
        });
      } else {
        await tx.runtime_matches.create({
          data: {
          session_id: sessionId,
            queue_order: queueMatch.queueOrder,
            court_number: null,
            status: 'READY',
            team_a: teamA,
            team_b: teamB
          }
        });
      }
    }

    if (queueOrders.length > 0) {
      await tx.runtime_matches.deleteMany({
        where: {
          session_id: sessionId,
          court_number: null,
          queue_order: { notIn: queueOrders }
        }
      });
    } else {
      await tx.runtime_matches.deleteMany({
        where: { session_id: sessionId, court_number: null, queue_order: { not: null } }
      });
    }

    for (const court of payload.courts) {
      const courtNumber = parseCourtNumber(court.courtId);
      if (courtNumber <= 0) continue;
      const { teamA, teamB } = rosterToTeams(court.roster);
      let runtimeMatchId: string | null = null;

      if (teamA.length + teamB.length > 0) {
        const existingMatch = await tx.runtime_matches.findFirst({
          where: { session_id: sessionId, court_number: courtNumber },
          orderBy: [{ updated_at: 'desc' }]
        });

        if (existingMatch) {
          await tx.runtime_matches.update({
            where: { id: existingMatch.id },
            data: {
              status: court.status,
              court_number: courtNumber,
              team_a: teamA,
              team_b: teamB
            }
          });
          runtimeMatchId = existingMatch.id;
        } else {
          const created = await tx.runtime_matches.create({
            data: {
              session_id: sessionId,
              court_number: courtNumber,
              status: court.status,
              team_a: teamA,
              team_b: teamB
            }
          });
          runtimeMatchId = created.id;
        }
      }

      const existingCourt = await tx.runtime_courts.findFirst({
        where: { session_id: sessionId, court_number: courtNumber }
      });

      if (existingCourt) {
        await tx.runtime_courts.update({
          where: { id: existingCourt.id },
          data: {
            status: court.status,
            runtime_match_id: runtimeMatchId,
            started_at: court.startedAt ? new Date(court.startedAt) : null,
            updated_at: new Date()
          }
        });
      } else {
        await tx.runtime_courts.create({
          data: {
            session_id: sessionId,
            court_number: courtNumber,
            status: court.status,
            runtime_match_id: runtimeMatchId,
            started_at: court.startedAt ? new Date(court.startedAt) : null
          }
        });
      }
    }
  });
}
