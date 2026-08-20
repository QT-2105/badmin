import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createSessionPlayer,
  deleteSessionPlayer,
  deleteSessionPlayerAvatar,
  fetchSessionPlayers,
  updateSessionPlayer,
  uploadSessionPlayerAvatar,
  type SessionPlayerPayload
} from '@/services/session-players-service';

export function useSessionPlayers(sessionId: string) {
  return useQuery({
    queryKey: ['session', 'players', sessionId],
    queryFn: ({ signal }) => fetchSessionPlayers(sessionId, signal),
    enabled: Boolean(sessionId)
  });
}

export function useSessionPlayerMutations(sessionId: string, options: { invalidateRuntime?: boolean } = {}) {
  const queryClient = useQueryClient();
  const invalidateRuntime = options.invalidateRuntime ?? true;
  const invalidate = async () => {
    const invalidations = [
      queryClient.invalidateQueries({ queryKey: ['session', 'players', sessionId] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    ];
    if (invalidateRuntime) invalidations.push(queryClient.invalidateQueries({ queryKey: ['runtime', 'snapshot', sessionId] }));
    await Promise.all(invalidations);
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
    }),
    uploadAvatar: useMutation({
      mutationFn: ({ id, file }: { id: string; file: File }) => uploadSessionPlayerAvatar(id, file),
      onSuccess: invalidate
    }),
    deleteAvatar: useMutation({
      mutationFn: deleteSessionPlayerAvatar,
      onSuccess: invalidate
    })
  };
}
