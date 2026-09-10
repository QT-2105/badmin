import { AppShell } from '@/components/app-shell';
import { SchedulePageClient } from '@/components/schedule/schedule-page-client';
import { requireTenantPageUser } from '@/lib/auth/guards';

export default async function TenantSchedulePage({ params }: { params: Promise<{ clubCode: string }> }) {
  const { clubCode } = await params;
  await requireTenantPageUser(clubCode, '/schedule');
  return <AppShell><SchedulePageClient /></AppShell>;
}
