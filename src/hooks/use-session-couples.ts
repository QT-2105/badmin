import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createSessionCouple,
  deleteSessionCouple,
  updateSessionCouple,
  type SessionCouplePayload
} from '@/services/session-couples-service';
import { tenantQueryKey, useTenantRoute } from '@/components/tenant/tenant-app-provider';

export function useSessionCoupleMutations(sessionId: string, options: { invalidateRuntime?: boolean } = {}) {
  const { clubId } = useTenantRoute();
  const queryClient = useQueryClient();
  const invalidateRuntime = options.invalidateRuntime ?? true;
  const invalidate = async () => {
    if (invalidateRuntime) await queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'runtime', 'snapshot', sessionId) });
  };

  return {
    createCouple: useMutation({
      mutationFn: (payload: SessionCouplePayload) => createSessionCouple(sessionId, payload),
      onSuccess: invalidate
    }),
    updateCouple: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<SessionCouplePayload> }) => updateSessionCouple(id, payload),
      onSuccess: invalidate
    }),
    deleteCouple: useMutation({
      mutationFn: deleteSessionCouple,
      onSuccess: invalidate
    })
  };
}
