'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, LogOut, Package, Settings2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BrandLogo } from '@/components/branding/brand-logo';
import { Button } from '@/components/ui/button';
import { FullscreenToggle } from '@/components/ui/fullscreen-toggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useCurrentUser, useLogoutMutation } from '@/hooks/use-auth';
import { useBranding } from '@/hooks/use-branding';
import { getRoleLabel, hasPermission, type PermissionKey } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Tổng quan',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: BarChart3, permission: 'dashboard.view' }
    ]
  },
  {
    label: 'Vận hành',
    items: [
      { href: '/schedule', label: 'Lịch chơi', icon: CalendarDays, permission: 'schedule.view' }
    ]
  },
  {
    label: 'Tài chính',
    items: [
      { href: '/finance', label: 'Thu chi', icon: CircleDollarSign, permission: 'finance.view' },
      { href: '/inventory', label: 'Kho cầu', icon: Package, permission: 'inventory.view' }
    ]
  },
  {
    label: 'Hệ thống',
    items: [
      { href: '/users', label: 'Người dùng', icon: ShieldCheck, permission: 'users.manage' },
      { href: '/settings', label: 'Cài đặt', icon: Settings2, permission: 'settings.manage' }
    ]
  }
] as const;

function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: branding } = useBranding();
  const { data: currentUser } = useCurrentUser();
  const logout = useLogoutMutation();
  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(currentUser ?? null, item.permission as PermissionKey))
    }))
    .filter((group) => group.items.length > 0);
  const visibleNavItems = visibleNavGroups.flatMap((group) => group.items);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('badmin_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    window.localStorage.setItem('badmin_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="min-h-screen">
        <aside
          className={cn(
            'fixed left-0 top-0 z-30 hidden h-screen border-r border-border bg-surface/95 backdrop-blur md:flex md:flex-col transition-[width] duration-200',
            collapsed ? 'w-[72px]' : 'w-[232px]'
          )}
        >
          <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-3">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
              <BrandLogo clubName={branding?.clubName} logoUrl={branding?.logoUrl} className="h-9 w-9 text-sm" textClassName="text-xs" />
              {!collapsed ? (
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">{branding?.clubName || 'Badmin'}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">Vận hành sân</span>
                </span>
              ) : null}
            </Link>
            <Button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              variant="ghost"
              size="sm"
              className="h-9 w-9 shrink-0 px-0 text-muted-foreground hover:text-foreground"
              aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          <nav className="flex-1 space-y-4 px-2 py-4">
            {visibleNavGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                {!collapsed ? (
                  <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {group.label}
                  </div>
                ) : null}
                {group.items.map((item) => {
                  const active = isNavItemActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href as Route}
                      className={cn(
                        'relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                        active
                          ? 'bg-primary/10 text-primary ring-1 ring-primary/15 before:absolute before:left-0 before:top-2 before:h-6 before:w-0.5 before:rounded-r-full before:bg-primary'
                          : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
                        collapsed && 'justify-center px-0'
                      )}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? `${group.label} · ${item.label}` : undefined}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed ? <span>{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="border-t border-border p-2">
            {!collapsed && currentUser ? (
              <div className="mb-2 flex items-center gap-2 px-1 py-1.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {currentUser.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-foreground">{currentUser.displayName}</div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{getRoleLabel(currentUser.role)}</div>
                </div>
              </div>
            ) : null}
            <FullscreenToggle compact={collapsed} className="w-full justify-center" />
            <ThemeToggle compact={collapsed} className="mt-2 w-full justify-center" />
            <Button
              type="button"
              onClick={() => void logout.mutateAsync()}
              disabled={logout.isPending}
              variant="secondary"
              size="sm"
              className={cn('mt-2 h-10 w-full justify-start text-xs text-muted-foreground hover:text-foreground', collapsed && 'justify-center px-0')}
              title={collapsed ? 'Đăng xuất' : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>Đăng xuất</span> : null}
            </Button>
          </div>

        </aside>

        <main
          className={cn(
            'min-h-screen min-w-0 bg-background transition-[margin-left] duration-200',
            collapsed ? 'md:ml-[72px]' : 'md:ml-[232px]'
          )}
        >
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-surface/90 px-3 backdrop-blur md:hidden">
            <Link href="/dashboard">
              <BrandLogo clubName={branding?.clubName} logoUrl={branding?.logoUrl} className="h-9 w-9 text-sm" textClassName="text-xs" />
            </Link>
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
              {visibleNavItems.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href as Route}
                    className={cn(
                      'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                      active ? 'bg-primary/10 text-primary ring-1 ring-primary/15' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
              <FullscreenToggle compact className="h-9 w-9 shrink-0 rounded-lg" />
              <ThemeToggle compact className="h-9 w-9 shrink-0 rounded-lg" />
              <Button
                type="button"
                onClick={() => void logout.mutateAsync()}
                disabled={logout.isPending}
                variant="secondary"
                size="sm"
                className="h-9 w-9 shrink-0 px-0 text-muted-foreground"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
