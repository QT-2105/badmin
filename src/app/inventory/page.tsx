import { AppShell } from '@/components/app-shell';
import { InventoryPageClient } from '@/components/inventory/inventory-page-client';

export default function InventoryPage() {
  return (
    <AppShell>
      <InventoryPageClient />
    </AppShell>
  );
}

