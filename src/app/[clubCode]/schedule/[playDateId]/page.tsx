import { AppShell } from '@/components/app-shell';
import { PlayDateDetailClient } from '@/components/schedule/play-date-detail-client';
import { requireTenantPageUser } from '@/lib/auth/guards';

type PageProps = { params: Promise<{ clubCode: string; playDateId: string }> };

export default async function TenantPlayDateDetailPage({ params }: PageProps) {
  const { clubCode, playDateId } = await params;
  await requireTenantPageUser(clubCode, `/schedule/${playDateId}`);
  return <AppShell><PlayDateDetailClient playDateId={playDateId} /></AppShell>;
}
