import { redirectLegacyPage } from '@/lib/auth/guards';

export default async function SettingsPage() {
  return redirectLegacyPage('/settings');
}
