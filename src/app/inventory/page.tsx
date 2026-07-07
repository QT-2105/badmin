import { AppShell } from '@/components/app-shell';
import { InventoryPageClient } from '@/components/inventory/inventory-page-client';
import { requirePageUser } from '@/lib/auth/guards';

export default async function InventoryPage() {
  await requirePageUser('/inventory');
  return (
    <AppShell>
      <InventoryPageClient />
    </AppShell>
  );
}
