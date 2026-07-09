'use client';

import { FormEvent, useState } from 'react';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';

import { consumeSessionExpiredNotice } from '@/components/auth/auth-session-boundary';
import { BrandLogo } from '@/components/branding/brand-logo';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/hooks/use-branding';
import { useBootstrapOwnerMutation, useBootstrapStatus, useLoginMutation } from '@/hooks/use-auth';

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: branding } = useBranding();
  const { data: needsBootstrap } = useBootstrapStatus();
  const login = useLoginMutation();
  const bootstrap = useBootstrapOwnerMutation();
  const [loginName, setLoginName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [sessionNotice] = useState(() => consumeSessionExpiredNotice(searchParams));
  const next = searchParams.get('next') || '/dashboard';
  const isBootstrap = needsBootstrap === true;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBootstrap) {
      await bootstrap.mutateAsync({ email: loginName, displayName, password });
    } else {
      await login.mutateAsync({ email: loginName, password });
    }
    router.push((next.startsWith('/') ? next : '/dashboard') as Route);
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 py-8 text-slate-100">
      <form onSubmit={(event) => void submit(event)} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <BrandLogo clubName={branding?.clubName} logoUrl={branding?.logoUrl} className="h-14 w-14 text-lg" textClassName="text-sm" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Badmin</p>
            <h1 className="text-xl font-semibold text-white">{branding?.clubName || (isBootstrap ? 'Khởi tạo quản trị' : 'Đăng nhập vận hành')}</h1>
            <p className="mt-1 text-sm text-slate-400">{isBootstrap ? 'Tạo tài khoản OWNER đầu tiên để bắt đầu sử dụng.' : 'Đăng nhập để sử dụng chương trình.'}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {isBootstrap ? (
            <label className="block">
              <span className="text-sm text-slate-300">Tên hiển thị</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
                autoComplete="name"
                required
              />
            </label>
          ) : null}
          <label className="block">
            <span className="text-sm text-slate-300">Tên đăng nhập</span>
            <input
              type="text"
              value={loginName}
              onChange={(event) => setLoginName(event.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              autoComplete="username"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              autoComplete="current-password"
              required
            />
          </label>
        </div>

        {sessionNotice ? (
          <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
            {sessionNotice}
          </div>
        ) : null}

        {login.error || bootstrap.error ? (
          <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {login.error?.message || bootstrap.error?.message}
          </div>
        ) : null}

        <Button type="submit" disabled={login.isPending || bootstrap.isPending || needsBootstrap === undefined} className="mt-5 h-12 w-full rounded-xl">
          {login.isPending || bootstrap.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {isBootstrap ? 'Tạo OWNER đầu tiên' : 'Đăng nhập'}
        </Button>
      </form>
    </main>
  );
}
