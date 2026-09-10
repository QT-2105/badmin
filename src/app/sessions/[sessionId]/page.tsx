import { redirectLegacyPage } from '@/lib/auth/guards';

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return redirectLegacyPage(`/sessions/${sessionId}`);
}
