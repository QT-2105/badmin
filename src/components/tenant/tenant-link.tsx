'use client';

import NextLink from 'next/link';
import type { ComponentProps } from 'react';
import type { Route } from 'next';

import { useTenantHref } from './tenant-app-provider';

type TenantLinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & { href: string };

export function TenantLink({ href, ...props }: TenantLinkProps) {
  const tenantHref = useTenantHref(href);
  return <NextLink href={tenantHref as Route} {...props} />;
}
