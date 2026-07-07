import { AppShell } from '@/components/app-shell';
import { PlayDateDetailClient } from '@/components/schedule/play-date-detail-client';
import { requirePageUser } from '@/lib/auth/guards';

type PageProps = {
  params: Promise<{ playDateId: string }>;
};

export default async function PlayDateDetailPage({ params }: PageProps) {
  const { playDateId } = await params;
  await requirePageUser(`/schedule/${playDateId}`);

  return (
    <AppShell>
      <PlayDateDetailClient playDateId={playDateId} />
    </AppShell>
  );
}
