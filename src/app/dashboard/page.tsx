import { AppShell } from '@/components/app-shell';
import { DashboardPageClient } from '@/components/dashboard/dashboard-page-client';
import { requirePageUser } from '@/lib/auth/guards';

export default async function DashboardPage() {
  await requirePageUser('/dashboard');
  return (
    <AppShell>
      <DashboardPageClient />
    </AppShell>
  );
}
