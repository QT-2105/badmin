import { redirectLegacyPage } from '@/lib/auth/guards';

export default async function SessionRuntimePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return redirectLegacyPage(`/sessions/${sessionId}/runtime`);
}
