import { AppShell } from '@/components/app-shell';
import { SessionDetailClient } from '@/components/schedule/session-detail-client';
import { requirePageUser } from '@/lib/auth/guards';

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SessionPage({ params }: PageProps) {
  const { sessionId } = await params;
  await requirePageUser(`/sessions/${sessionId}`);

  return (
    <AppShell>
      <SessionDetailClient sessionId={sessionId} />
    </AppShell>
  );
}
