'use client';

import { useEffect } from 'react';

import { RealtimeDashboard } from '@/components/realtime-dashboard';
import { useBadmintonStore } from '@/lib/badminton-store';
import { useTenantRoute } from '@/components/tenant/tenant-app-provider';
import { tenantRuntimeSessionStorageKey } from '@/lib/tenant-storage-keys';

export function RuntimeRouteClient({ sessionId }: { sessionId: string }) {
  const setRuntimeSessionId = useBadmintonStore((state) => state.setRuntimeSessionId);
  const { clubId } = useTenantRoute();

  useEffect(() => {
    localStorage.setItem(tenantRuntimeSessionStorageKey(clubId), sessionId);
    setRuntimeSessionId(sessionId);
  }, [clubId, sessionId, setRuntimeSessionId]);

  return <RealtimeDashboard />;
}
