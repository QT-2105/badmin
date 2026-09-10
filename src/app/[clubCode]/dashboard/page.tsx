import { AppShell } from '@/components/app-shell';
import { DashboardPageClient } from '@/components/dashboard/dashboard-page-client';
import { requireTenantPageUser } from '@/lib/auth/guards';

export default async function TenantDashboardPage({ params }: { params: Promise<{ clubCode: string }> }) {
  const { clubCode } = await params;
  await requireTenantPageUser(clubCode, '/dashboard');
  return <AppShell><DashboardPageClient /></AppShell>;
}
