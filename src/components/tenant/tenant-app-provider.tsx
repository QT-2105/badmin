'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type TenantRouteValue = {
  clubId: string;
  clubCode: string;
};

const TenantRouteContext = createContext<TenantRouteValue | null>(null);

export function TenantAppProvider({ clubId, clubCode, children }: TenantRouteValue & { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 30_000
      }
    }
  }));

  useEffect(() => () => queryClient.clear(), [queryClient]);

  return (
    <TenantRouteContext.Provider value={{ clubId, clubCode }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TenantRouteContext.Provider>
  );
}

export function useTenantRoute(): TenantRouteValue {
  const context = useContext(TenantRouteContext);
  if (!context) throw new Error('Tenant route context chưa được thiết lập.');
  return context;
}

export function useTenantHref(pathname: string): string {
  const { clubCode } = useTenantRoute();
  return buildTenantHref(clubCode, pathname);
}

export function buildTenantHref(clubCode: string, pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `/${clubCode}${normalized === '/' ? '' : normalized}`;
}

export function tenantQueryKey(clubId: string, ...segments: readonly unknown[]): readonly unknown[] {
  return ['tenant', clubId, ...segments];
}
