import { useQuery } from '@tanstack/react-query';

import type { RuntimeSnapshot } from '@/types/runtime';
import { fetchRuntimeSnapshot } from '@/services/runtime-snapshot-service';

type UseRuntimeSnapshotOptions = {
  sessionId?: string;
  enabled?: boolean;
  refetchIntervalMs?: number | false;
  initialData?: RuntimeSnapshot;
};

export function useRuntimeSnapshot(options: UseRuntimeSnapshotOptions = {}) {
  const {
    sessionId,
    enabled = true,
    refetchIntervalMs = false,
    initialData
  } = options;

  return useQuery({
    queryKey: ['runtime', 'snapshot', sessionId ?? 'active'],
    queryFn: ({ signal }) => fetchRuntimeSnapshot(sessionId, signal),
    enabled,
    initialData,
    refetchInterval: refetchIntervalMs,
    refetchOnWindowFocus: false,
    staleTime: 30_000
  });
}
