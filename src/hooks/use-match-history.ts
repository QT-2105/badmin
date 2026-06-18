import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createMatchHistory, fetchMatchHistory, type MatchHistoryPayload } from '@/services/match-history-service';

export function useMatchHistory(sessionId: string, playerId?: string | null) {
  return useQuery({
    queryKey: ['session', 'match-history', sessionId, playerId || 'all'],
    queryFn: ({ signal }) => fetchMatchHistory(sessionId, playerId, signal),
    enabled: Boolean(sessionId)
  });
}

export function useMatchHistoryMutations(sessionId: string) {
  const queryClient = useQueryClient();

  return {
    createHistory: useMutation({
      mutationFn: (payload: MatchHistoryPayload) => createMatchHistory(sessionId, payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['session', 'match-history', sessionId] });
      }
    })
  };
}
