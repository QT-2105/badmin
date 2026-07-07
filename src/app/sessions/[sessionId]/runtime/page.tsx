import { RuntimeRouteClient } from '@/components/runtime-route-client';
import { requirePageUser } from '@/lib/auth/guards';

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SessionRuntimePage({ params }: PageProps) {
  const { sessionId } = await params;
  await requirePageUser(`/sessions/${sessionId}/runtime`);
  return <RuntimeRouteClient sessionId={sessionId} />;
}
