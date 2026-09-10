import { AppShell } from '@/components/app-shell';
import { FinancePageClient } from '@/components/finance/finance-page-client';
import { requireTenantPageUser } from '@/lib/auth/guards';

export default async function TenantFinancePage({ params }: { params: Promise<{ clubCode: string }> }) {
  const { clubCode } = await params;
  await requireTenantPageUser(clubCode, '/finance');
  return <AppShell><FinancePageClient /></AppShell>;
}
