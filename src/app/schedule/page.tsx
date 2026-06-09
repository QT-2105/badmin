import { AppShell } from '@/components/app-shell';
import { SchedulePageClient } from '@/components/schedule/schedule-page-client';

export default function SchedulePage() {
  return (
    <AppShell>
      <SchedulePageClient />
    </AppShell>
  );
}

