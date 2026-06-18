import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/app-error';
import type { MatchHistoryParticipant, MatchHistorySummary } from '@/types/domain';

type MatchHistoryPlayerInput = {
  playerId: string;
  playerName: string;
};

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function mapParticipant(row: {
  session_player_id: string;
  team: string;
  position: number;
  session_players?: { full_name: string } | null;
}): MatchHistoryParticipant {
  return {
    playerId: row.session_player_id,
    playerName: row.session_players?.full_name ?? '',
    team: row.team === 'B' ? 'B' : 'A',
    position: row.position
  };
}

function mapHistory(row: {
  id: string;
  session_id: string;
  court_number: number;
  court_name: string;
  started_at: Date | null;
  ended_at: Date;
  duration_seconds: number | null;
  created_at: Date | null;
  match_history_players?: Array<{
    session_player_id: string;
    team: string;
    position: number;
    session_players?: { full_name: string } | null;
  }>;
}): MatchHistorySummary {
  const participants = (row.match_history_players ?? []).map(mapParticipant).sort((left, right) => left.position - right.position);

  return {
    id: row.id,
    sessionId: row.session_id,
    courtNumber: row.court_number,
    courtName: row.court_name,
    startedAt: toIso(row.started_at),
    endedAt: row.ended_at.toISOString(),
    durationSeconds: row.duration_seconds,
    teamA: participants.filter((participant) => participant.team === 'A'),
    teamB: participants.filter((participant) => participant.team === 'B'),
    createdAt: toIso(row.created_at)
  };
}

export async function listMatchHistory(sessionId: string, playerId?: string | null): Promise<MatchHistorySummary[]> {
  const rows = await prisma.match_histories.findMany({
    where: {
      session_id: sessionId,
      ...(playerId
        ? {
            match_history_players: {
              some: { session_player_id: playerId }
            }
          }
        : {})
    },
    include: {
      match_history_players: {
        include: {
          session_players: {
            select: { full_name: true }
          }
        },
        orderBy: [{ team: 'asc' }, { position: 'asc' }]
      }
    },
    orderBy: [{ ended_at: 'desc' }]
  });

  return rows.map(mapHistory);
}

export async function createMatchHistory(input: {
  sessionId: string;
  courtNumber: number;
  courtName: string;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSeconds?: number | null;
  teamA: MatchHistoryPlayerInput[];
  teamB: MatchHistoryPlayerInput[];
}): Promise<MatchHistorySummary> {
  if (!input.sessionId) throw new AppError('Không tìm thấy ca chơi.');
  if (!Number.isFinite(input.courtNumber) || input.courtNumber < 1) throw new AppError('Sân không hợp lệ.');
  if (input.teamA.length !== 2 || input.teamB.length !== 2) throw new AppError('Lịch sử trận cần đủ 2 đội, mỗi đội 2 người.');

  const playerIds = [...input.teamA, ...input.teamB].map((player) => player.playerId);
  if (new Set(playerIds).size !== 4) throw new AppError('Người chơi trong lịch sử trận bị trùng.');

  const sessionPlayers = await prisma.session_players.findMany({
    where: {
      session_id: input.sessionId,
      id: { in: playerIds }
    },
    select: { id: true }
  });
  if (sessionPlayers.length !== 4) throw new AppError('Danh sách người chơi của trận không hợp lệ.');

  const startedAt = input.startedAt ? new Date(input.startedAt) : null;
  const endedAt = input.endedAt ? new Date(input.endedAt) : new Date();
  const durationSeconds = input.durationSeconds === null || input.durationSeconds === undefined
    ? null
    : Math.max(0, Math.floor(Number(input.durationSeconds)));

  const created = await prisma.match_histories.create({
    data: {
      session_id: input.sessionId,
      court_number: Math.floor(input.courtNumber),
      court_name: input.courtName.trim() || `Sân ${input.courtNumber}`,
      started_at: startedAt && !Number.isNaN(startedAt.getTime()) ? startedAt : null,
      ended_at: Number.isNaN(endedAt.getTime()) ? new Date() : endedAt,
      duration_seconds: durationSeconds,
      team_a: input.teamA,
      team_b: input.teamB,
      match_history_players: {
        createMany: {
          data: [
            ...input.teamA.map((player, index) => ({
              session_player_id: player.playerId,
              team: 'A',
              position: index
            })),
            ...input.teamB.map((player, index) => ({
              session_player_id: player.playerId,
              team: 'B',
              position: index
            }))
          ]
        }
      }
    },
    include: {
      match_history_players: {
        include: {
          session_players: {
            select: { full_name: true }
          }
        }
      }
    }
  });

  return mapHistory(created);
}

export async function deleteAllMatchHistory(): Promise<{ deletedMatches: number; deletedParticipants: number }> {
  return prisma.$transaction(async (tx) => {
    const participants = await tx.match_history_players.deleteMany();
    const matches = await tx.match_histories.deleteMany();

    return {
      deletedMatches: matches.count,
      deletedParticipants: participants.count
    };
  });
}
