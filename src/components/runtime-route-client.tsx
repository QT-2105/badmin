'use client';

import { useEffect } from 'react';

import { RealtimeDashboard } from '@/components/realtime-dashboard';
import { useBadmintonStore } from '@/lib/badminton-store';

export function RuntimeRouteClient({ sessionId }: { sessionId: string }) {
  const setRuntimeSessionId = useBadmintonStore((state) => state.setRuntimeSessionId);

  useEffect(() => {
    localStorage.setItem('badmin_active_session_id', sessionId);
    setRuntimeSessionId(sessionId);
  }, [sessionId, setRuntimeSessionId]);

  return <RealtimeDashboard />;
}

