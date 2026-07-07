import { AppShell } from '@/components/app-shell';
import { SchedulePageClient } from '@/components/schedule/schedule-page-client';
import { requirePageUser } from '@/lib/auth/guards';

export default async function SchedulePage() {
  await requirePageUser('/schedule');
  return (
    <AppShell>
      <SchedulePageClient />
    </AppShell>
  );
}
