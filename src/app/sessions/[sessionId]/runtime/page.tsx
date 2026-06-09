import { RuntimeRouteClient } from '@/components/runtime-route-client';

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SessionRuntimePage({ params }: PageProps) {
  const { sessionId } = await params;
  return <RuntimeRouteClient sessionId={sessionId} />;
}

