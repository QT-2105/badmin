import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createSessionPlayer,
  deleteSessionPlayer,
  fetchSessionPlayers,
  updateSessionPlayer,
  type SessionPlayerPayload
} from '@/services/session-players-service';

export function useSessionPlayers(sessionId: string) {
  return useQuery({
    queryKey: ['session', 'players', sessionId],
    queryFn: ({ signal }) => fetchSessionPlayers(sessionId, signal),
    enabled: Boolean(sessionId)
  });
}

export function useSessionPlayerMutations(sessionId: string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['session', 'players', sessionId] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] }),
      queryClient.invalidateQueries({ queryKey: ['runtime', 'snapshot', sessionId] })
    ]);
  };

  return {
    createPlayer: useMutation({
      mutationFn: (payload: SessionPlayerPayload) => createSessionPlayer(sessionId, payload),
      onSuccess: invalidate
    }),
    updatePlayer: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<SessionPlayerPayload> }) => updateSessionPlayer(id, payload),
      onSuccess: invalidate
    }),
    deletePlayer: useMutation({
      mutationFn: deleteSessionPlayer,
      onSuccess: invalidate
    })
  };
}
