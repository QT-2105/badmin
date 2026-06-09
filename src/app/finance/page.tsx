import { AppShell } from '@/components/app-shell';
import { FinancePageClient } from '@/components/finance/finance-page-client';

export default function FinancePage() {
  return (
    <AppShell>
      <FinancePageClient />
    </AppShell>
  );
}

