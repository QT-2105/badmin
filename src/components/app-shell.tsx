'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, LogOut, Package, Settings2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BrandLogo } from '@/components/branding/brand-logo';
import { FullscreenToggle } from '@/components/ui/fullscreen-toggle';
import { useCurrentUser, useLogoutMutation } from '@/hooks/use-auth';
import { useBranding } from '@/hooks/use-branding';
import { getRoleLabel, hasPermission, type PermissionKey } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, permission: 'dashboard.view' },
  { href: '/schedule', label: 'Lịch chơi', icon: CalendarDays, permission: 'schedule.view' },
  { href: '/finance', label: 'Thu chi', icon: CircleDollarSign, permission: 'finance.view' },
  { href: '/inventory', label: 'Kho cầu', icon: Package, permission: 'inventory.view' },
  { href: '/users', label: 'User', icon: ShieldCheck, permission: 'users.manage' },
  { href: '/settings', label: 'Cài đặt', icon: Settings2, permission: 'settings.manage' }
] as const;

function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: branding } = useBranding();
  const { data: currentUser } = useCurrentUser();
  const logout = useLogoutMutation();
  const visibleNavItems = navItems.filter((item) => hasPermission(currentUser ?? null, item.permission as PermissionKey));
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('badmin_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    window.localStorage.setItem('badmin_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="min-h-screen">
        <aside
          className={cn(
            'fixed left-0 top-0 z-30 hidden h-screen border-r border-white/10 bg-slate-950/95 md:flex md:flex-col transition-[width] duration-200',
            collapsed ? 'w-[72px]' : 'w-60'
          )}
        >
          <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-3">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
              <BrandLogo clubName={branding?.clubName} logoUrl={branding?.logoUrl} className="h-9 w-9 text-sm" textClassName="text-xs" />
              {!collapsed ? (
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{branding?.clubName || 'Badmin'}</span>
                  <span className="block truncate text-[11px] text-slate-400">Vận hành sân</span>
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-100"
              aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-3">
            {visibleNavItems.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  className={cn(
                    'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                    active ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                    collapsed && 'justify-center px-0'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-2">
            {!collapsed && currentUser ? (
              <div className="mb-2 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                <div className="truncate text-xs font-semibold text-white">{currentUser.displayName}</div>
                <div className="mt-0.5 truncate text-[11px] text-slate-400">{getRoleLabel(currentUser.role)}</div>
              </div>
            ) : null}
            <FullscreenToggle compact={collapsed} className="w-full justify-center" />
            <button
              type="button"
              onClick={() => void logout.mutateAsync()}
              disabled={logout.isPending}
              className={cn(
                'mt-2 flex h-10 w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-60',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? 'Đăng xuất' : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>Đăng xuất</span> : null}
            </button>
          </div>

        </aside>

        <main
          className={cn(
            'min-w-0 transition-[margin-left] duration-200',
            collapsed ? 'md:ml-[72px]' : 'md:ml-60'
          )}
        >
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-white/10 bg-slate-950/90 px-3 backdrop-blur md:hidden">
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
                      'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold',
                      active ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-400'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
              <FullscreenToggle compact className="h-9 w-9 shrink-0 rounded-lg" />
              <button
                type="button"
                onClick={() => void logout.mutateAsync()}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-300"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
