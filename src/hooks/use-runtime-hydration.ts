import { useEffect } from 'react';

import { useBadmintonStore } from '@/lib/badminton-store';
import { useRuntimeSnapshot } from '@/hooks/use-runtime-snapshot';

type UseRuntimeHydrationOptions = {
  sessionId?: string;
  enabled?: boolean;
};

export function useRuntimeHydration(options: UseRuntimeHydrationOptions = {}) {
  const { sessionId, enabled = true } = options;
  const hydrateRuntimeSnapshot = useBadmintonStore((state) => state.hydrateRuntimeSnapshot);
  const query = useRuntimeSnapshot({ sessionId, enabled });

  useEffect(() => {
    if (!query.data) return;
    hydrateRuntimeSnapshot(query.data);
  }, [hydrateRuntimeSnapshot, query.data]);

  return query;
}
