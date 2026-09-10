import { Suspense } from 'react';

import { OwnerActivationPageClient } from '@/components/auth/owner-activation-page-client';

export default function ActivateOwnerPage() {
  return <Suspense fallback={<div className="min-h-screen bg-background" />}><OwnerActivationPageClient /></Suspense>;
}
