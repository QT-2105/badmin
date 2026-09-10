import { AppShell } from '@/components/app-shell';
import { SessionDetailClient } from '@/components/schedule/session-detail-client';
import { requireTenantPageUser } from '@/lib/auth/guards';

type PageProps = { params: Promise<{ clubCode: string; sessionId: string }> };

export default async function TenantSessionPage({ params }: PageProps) {
  const { clubCode, sessionId } = await params;
  await requireTenantPageUser(clubCode, `/sessions/${sessionId}`);
  return <AppShell><SessionDetailClient sessionId={sessionId} /></AppShell>;
}
