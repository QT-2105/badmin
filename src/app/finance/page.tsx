import { AppShell } from '@/components/app-shell';
import { FinancePageClient } from '@/components/finance/finance-page-client';
import { requirePageUser } from '@/lib/auth/guards';

export default async function FinancePage() {
  await requirePageUser('/finance');
  return (
    <AppShell>
      <FinancePageClient />
    </AppShell>
  );
}
