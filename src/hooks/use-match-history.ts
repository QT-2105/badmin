import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createMatchHistory, fetchMatchHistory, type MatchHistoryPayload } from '@/services/match-history-service';
import { tenantQueryKey, useTenantRoute } from '@/components/tenant/tenant-app-provider';

export function useMatchHistory(sessionId: string, playerId?: string | null) {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'session', 'match-history', sessionId, playerId || 'all'),
    queryFn: ({ signal }) => fetchMatchHistory(sessionId, playerId, signal),
    enabled: Boolean(sessionId)
  });
}

export function useMatchHistoryMutations(sessionId: string) {
  const { clubId } = useTenantRoute();
  const queryClient = useQueryClient();

  return {
    createHistory: useMutation({
      mutationFn: (payload: MatchHistoryPayload) => createMatchHistory(sessionId, payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'session', 'match-history', sessionId) });
      }
    })
  };
}
