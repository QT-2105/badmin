import { RuntimeRouteClient } from '@/components/runtime-route-client';
import { requireTenantPageUser } from '@/lib/auth/guards';

type PageProps = { params: Promise<{ clubCode: string; sessionId: string }> };

export default async function TenantSessionRuntimePage({ params }: PageProps) {
  const { clubCode, sessionId } = await params;
  await requireTenantPageUser(clubCode, `/sessions/${sessionId}/runtime`);
  return <RuntimeRouteClient sessionId={sessionId} />;
}
