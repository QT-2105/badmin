import { redirectLegacyPage } from '@/lib/auth/guards';

export default async function InventoryPage() {
  return redirectLegacyPage('/inventory');
}
