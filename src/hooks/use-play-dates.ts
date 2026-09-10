import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createPlayDate,
  createPlaySession,
  completePlaySession,
  deletePlayDate,
  deletePlaySession,
  fetchPlayDate,
  fetchPlayDates,
  fetchPlaySession,
  updatePlayDate,
  updatePlaySession
} from '@/services/schedule-service';
import { tenantQueryKey, useTenantRoute } from '@/components/tenant/tenant-app-provider';

export function usePlayDates() {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'schedule', 'play-dates'),
    queryFn: ({ signal }) => fetchPlayDates(signal)
  });
}

export function usePlayDate(id: string) {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'schedule', 'play-date', id),
    queryFn: ({ signal }) => fetchPlayDate(id, signal),
    enabled: Boolean(id)
  });
}

export function usePlaySession(id: string) {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'schedule', 'session', id),
    queryFn: ({ signal }) => fetchPlaySession(id, signal),
    enabled: Boolean(id)
  });
}

export function useScheduleMutations(playDateId?: string) {
  const { clubId } = useTenantRoute();
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'schedule', 'play-dates') }),
      queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'dashboard', 'summary') }),
      playDateId ? queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'schedule', 'play-date', playDateId) }) : Promise.resolve()
    ]);
  };

  return {
    createPlayDate: useMutation({ mutationFn: createPlayDate, onSuccess: invalidate }),
    updatePlayDate: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updatePlayDate>[1] }) => updatePlayDate(id, payload), onSuccess: invalidate }),
    deletePlayDate: useMutation({ mutationFn: deletePlayDate, onSuccess: invalidate }),
    createPlaySession: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof createPlaySession>[1] }) => createPlaySession(id, payload), onSuccess: invalidate }),
    updatePlaySession: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updatePlaySession>[1] }) => updatePlaySession(id, payload),
      onSuccess: async (_data, variables) => {
        await Promise.all([
          invalidate(),
          queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'schedule', 'session', variables.id) }),
          queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'runtime', 'snapshot', variables.id) })
        ]);
      }
    }),
    completePlaySession: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof completePlaySession>[1] }) => completePlaySession(id, payload),
      onSuccess: async (_data, variables) => {
        await Promise.all([
          invalidate(),
          queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'schedule', 'session', variables.id) }),
          queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'finance', 'transactions') }),
          queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'inventory', 'products') }),
          queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'runtime', 'snapshot', variables.id) })
        ]);
      }
    }),
    deletePlaySession: useMutation({ mutationFn: deletePlaySession, onSuccess: invalidate })
  };
}
