'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, LogOut, Package, Settings2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BrandLogo } from '@/components/branding/brand-logo';
import { Button } from '@/components/ui/button';
import { FullscreenToggle } from '@/components/ui/fullscreen-toggle';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useCurrentUser, useLogoutMutation } from '@/hooks/use-auth';
import { useBranding } from '@/hooks/use-branding';
import { getRoleLabel, hasPermission, type AuthUser, type PermissionKey } from '@/lib/auth/permissions';
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

const sidebarInteractiveClass =
  'hover:border-primary/40 hover:bg-primary-soft hover:text-primary hover:ring-2 hover:ring-primary/15 focus-visible:ring-focus/50 active:bg-primary-soft/80 active:text-primary';

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/schedule') {
    return pathname === href || pathname.startsWith('/schedule/') || pathname.startsWith('/sessions/');
  }

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
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem('badmin_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function markNavigationPending(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || isNavItemActive(pathname, href)
    ) {
      return;
    }

    setPendingHref(href);
  }

  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-background text-foreground">
      {pendingHref ? (
        <div
          role="status"
          aria-label="Đang chuyển trang"
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-primary/15"
        >
          <span className="block h-full w-2/5 animate-[badmin-navigation-progress_900ms_ease-in-out_infinite] bg-primary shadow-[0_0_10px_var(--color-primary)] motion-reduce:w-full motion-reduce:animate-none" />
        </div>
      ) : null}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-focus/25"
      >
        Bỏ qua điều hướng
      </a>
      <div className="min-h-screen min-w-0">
        <aside
          className={cn(
            'fixed left-0 top-0 z-30 hidden h-screen border-r border-border/80 bg-surface-elevated/95 backdrop-blur md:flex md:flex-col transition-[width] duration-200 ease-[var(--ease-standard)] motion-reduce:transition-none',
            collapsed ? 'w-[88px]' : 'w-[232px]'
          )}
        >
          <div
            className={cn(
              'relative flex h-16 items-center gap-2 border-b border-border/80',
              collapsed ? 'justify-between gap-1.5 px-2' : 'justify-between px-3'
            )}
          >
            <Link
              href="/dashboard"
              className={cn(
                'flex min-w-0 items-center gap-2 rounded-full outline-none transition-[width,opacity,background-color,box-shadow] duration-200 ease-[var(--ease-standard)] hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus/40 motion-reduce:transition-none',
                collapsed && 'grid h-9 w-9 shrink-0 place-items-center overflow-hidden'
              )}
              aria-label={collapsed ? `${branding?.clubName || 'Badmin'} dashboard` : undefined}
              title={collapsed ? branding?.clubName || 'Badmin' : undefined}
            >
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
              className={cn(
                'h-10 w-10 shrink-0 bg-surface-muted px-0 text-muted-foreground ring-1 ring-border transition-[width,height,background-color,border-color,color,box-shadow] duration-200 ease-[var(--ease-standard)] motion-reduce:transition-none',
                sidebarInteractiveClass,
                collapsed && 'h-7 w-7 rounded-lg bg-transparent ring-0'
              )}
              aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          <nav aria-label="Điều hướng chính" className="flex-1 space-y-4 px-2 py-4">
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
                      onClick={(event) => markNavigationPending(event, item.href)}
                      className={cn(
                        'relative flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium outline-none transition-[background-color,border-color,color,box-shadow,padding] duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-reduce:transition-none',
                        active
                          ? 'border-primary/30 bg-primary-soft font-semibold text-primary ring-1 ring-primary/15 before:absolute before:left-0 before:top-2 before:h-6 before:w-0.5 before:rounded-r-full before:bg-primary hover:border-primary/50 hover:bg-primary-soft hover:ring-2 hover:ring-primary/20 focus-visible:ring-focus/50 active:bg-primary-soft/80'
                          : `border-transparent text-muted-foreground ${sidebarInteractiveClass}`,
                        collapsed && 'justify-center px-0'
                      )}
                      aria-current={active ? 'page' : undefined}
                      aria-label={`${group.label}: ${item.label}${active ? ' đang mở' : ''}`}
                      title={collapsed ? `${group.label} · ${item.label}` : undefined}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                      {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
                      {active && !collapsed ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold leading-4 text-primary ring-1 ring-primary/15">
                          Đang mở
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="border-t border-border/80 p-2">
            {currentUser ? <CurrentUserSummary user={currentUser} collapsed={collapsed} /> : null}
            <FullscreenToggle compact={collapsed} className={cn('w-full justify-center', sidebarInteractiveClass)} />
            <ThemeToggle compact={collapsed} className={cn('mt-2 w-full justify-center', sidebarInteractiveClass)} />
            <Button
              type="button"
              onClick={() => void logout.mutateAsync()}
              disabled={logout.isPending}
              variant="secondary"
              size="sm"
              className={cn('mt-2 h-10 w-full justify-start text-xs text-muted-foreground', sidebarInteractiveClass, collapsed && 'justify-center px-0')}
              title={collapsed ? 'Đăng xuất' : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>Đăng xuất</span> : null}
            </Button>
          </div>

        </aside>

        <main
          id="main-content"
          className={cn(
            'min-h-screen min-w-0 overflow-x-clip bg-background transition-[margin-left] duration-200 ease-[var(--ease-standard)] motion-reduce:transition-none',
            collapsed ? 'md:ml-[88px]' : 'md:ml-[232px]'
          )}
        >
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/80 bg-surface-elevated/95 px-3 backdrop-blur md:hidden">
            <Link href="/dashboard">
              <BrandLogo clubName={branding?.clubName} logoUrl={branding?.logoUrl} className="h-9 w-9 text-sm" textClassName="text-xs" />
            </Link>
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto overscroll-x-contain">
              {visibleNavItems.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href as Route}
                    onClick={(event) => markNavigationPending(event, item.href)}
                    className={cn(
                      'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold outline-none transition-[background-color,border-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-reduce:transition-none',
                      active
                        ? 'border-primary/30 bg-primary-soft text-primary ring-1 ring-primary/15 hover:border-primary/50 hover:bg-primary-soft hover:ring-2 hover:ring-primary/20'
                        : `border-transparent text-muted-foreground ${sidebarInteractiveClass}`
                    )}
                    aria-current={active ? 'page' : undefined}
                    aria-label={`${item.label}${active ? ' đang mở' : ''}`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
              <FullscreenToggle compact className="h-10 w-10 shrink-0 rounded-lg" />
              <ThemeToggle compact className="h-10 w-10 shrink-0 rounded-lg" />
              <Button
                type="button"
                onClick={() => void logout.mutateAsync()}
                disabled={logout.isPending}
                variant="secondary"
                size="sm"
                className="h-10 w-10 shrink-0 px-0 text-muted-foreground"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

function CurrentUserSummary({ user, collapsed }: { user: AuthUser; collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="mb-2 flex justify-center" title={`${user.displayName} · ${getRoleLabel(user.role)}`}>
        <UserInitialsAvatar user={user} className="h-10 w-10" />
      </div>
    );
  }

  return (
    <section
      aria-label="Tài khoản hiện tại"
      className="mb-2 rounded-xl border border-border bg-surface-muted px-2.5 py-2 shadow-subtle"
    >
      <div className="flex min-w-0 items-center gap-2">
        <UserInitialsAvatar user={user} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-foreground">{user.displayName}</div>
          <div className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">{getRoleLabel(user.role)}</div>
        </div>
      </div>
    </section>
  );
}

function UserInitialsAvatar({ user, className }: { user: AuthUser; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary-soft text-xs font-bold uppercase text-primary',
        className
      )}
    >
      {getUserInitials(user.displayName, user.email)}
    </div>
  );
}

function getUserInitials(displayName: string, email: string): string {
  const source = displayName.trim() || email.trim();
  if (!source) return 'U';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}
