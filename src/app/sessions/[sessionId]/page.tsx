import { AppShell } from '@/components/app-shell';
import { SessionDetailClient } from '@/components/schedule/session-detail-client';

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SessionPage({ params }: PageProps) {
  const { sessionId } = await params;

  return (
    <AppShell>
      <SessionDetailClient sessionId={sessionId} />
    </AppShell>
  );
}

