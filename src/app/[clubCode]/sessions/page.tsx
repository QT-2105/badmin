import { redirect } from 'next/navigation';
import type { Route } from 'next';

export default async function TenantSessionsPage({ params }: { params: Promise<{ clubCode: string }> }) {
  const { clubCode } = await params;
  redirect(`/${clubCode}/schedule` as Route);
}
