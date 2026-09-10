import { redirectLegacyPage } from '@/lib/auth/guards';

export default async function FinancePage() {
  return redirectLegacyPage('/finance');
}
