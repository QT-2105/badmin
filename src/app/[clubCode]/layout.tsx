import type { ReactNode } from 'react';

import { TenantAppProvider } from '@/components/tenant/tenant-app-provider';
import { getCurrentUserFromCookies } from '@/lib/auth/session';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ clubCode: string }>;
};

export default async function TenantLayout({ children, params }: LayoutProps) {
  const { clubCode } = await params;
  const user = await getCurrentUserFromCookies();
  const normalizedCode = clubCode.normalize('NFKC').trim().toLowerCase();
  const tenantKey = user?.clubId ?? `anonymous:${normalizedCode}`;

  return (
    <TenantAppProvider key={`${tenantKey}:${normalizedCode}`} clubId={tenantKey} clubCode={normalizedCode}>
      {children}
    </TenantAppProvider>
  );
}
