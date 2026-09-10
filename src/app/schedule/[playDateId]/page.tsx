import { redirectLegacyPage } from '@/lib/auth/guards';

export default async function PlayDateDetailPage({ params }: { params: Promise<{ playDateId: string }> }) {
  const { playDateId } = await params;
  return redirectLegacyPage(`/schedule/${playDateId}`);
}
