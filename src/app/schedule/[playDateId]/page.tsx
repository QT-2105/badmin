import { AppShell } from '@/components/app-shell';
import { PlayDateDetailClient } from '@/components/schedule/play-date-detail-client';

type PageProps = {
  params: Promise<{ playDateId: string }>;
};

export default async function PlayDateDetailPage({ params }: PageProps) {
  const { playDateId } = await params;

  return (
    <AppShell>
      <PlayDateDetailClient playDateId={playDateId} />
    </AppShell>
  );
}

