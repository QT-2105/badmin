import { AppShell } from '@/components/app-shell';
import { SettingsPageClient } from '@/components/settings/settings-page-client';
import { requireTenantPageUser } from '@/lib/auth/guards';

export default async function TenantSettingsPage({ params }: { params: Promise<{ clubCode: string }> }) {
  const { clubCode } = await params;
  await requireTenantPageUser(clubCode, '/settings');
  return <AppShell><SettingsPageClient /></AppShell>;
}
