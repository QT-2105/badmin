import { AppShell } from '@/components/app-shell';
import { SettingsPageClient } from '@/components/settings/settings-page-client';

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsPageClient />
    </AppShell>
  );
}
