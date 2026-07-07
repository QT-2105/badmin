import { AppShell } from '@/components/app-shell';
import { SettingsPageClient } from '@/components/settings/settings-page-client';
import { requirePageUser } from '@/lib/auth/guards';

export default async function SettingsPage() {
  await requirePageUser('/settings');
  return (
    <AppShell>
      <SettingsPageClient />
    </AppShell>
  );
}
