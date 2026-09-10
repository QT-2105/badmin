import { redirectLegacyPage } from '@/lib/auth/guards';

export default async function DashboardPage() {
  return redirectLegacyPage('/dashboard');
}
