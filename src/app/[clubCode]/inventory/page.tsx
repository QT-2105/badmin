import { AppShell } from '@/components/app-shell';
import { InventoryPageClient } from '@/components/inventory/inventory-page-client';
import { requireTenantPageUser } from '@/lib/auth/guards';

export default async function TenantInventoryPage({ params }: { params: Promise<{ clubCode: string }> }) {
  const { clubCode } = await params;
  await requireTenantPageUser(clubCode, '/inventory');
  return <AppShell><InventoryPageClient /></AppShell>;
}
