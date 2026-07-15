'use client';

import { FormEvent, useState } from 'react';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';

import { consumeSessionExpiredNotice } from '@/components/auth/auth-session-boundary';
import { BrandLogo } from '@/components/branding/brand-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { formInputClass, formLabelClass } from '@/components/ui/page-layout';
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
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <form onSubmit={(event) => void submit(event)} className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-md">
        <div className="flex items-center gap-3">
          <BrandLogo clubName={branding?.clubName} logoUrl={branding?.logoUrl} className="h-14 w-14 text-lg" textClassName="text-sm" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-info">Badmin</p>
            <h1 className="text-xl font-semibold text-foreground">{branding?.clubName || (isBootstrap ? 'Khởi tạo quản trị' : 'Đăng nhập vận hành')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{isBootstrap ? 'Tạo tài khoản OWNER đầu tiên để bắt đầu sử dụng.' : 'Đăng nhập để sử dụng chương trình.'}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {isBootstrap ? (
            <label className="block">
              <span className={formLabelClass}>Tên hiển thị</span>
              <Input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className={formInputClass}
                autoComplete="name"
                required
              />
            </label>
          ) : null}
          <label className="block">
            <span className={formLabelClass}>Tên đăng nhập</span>
            <Input
              type="text"
              value={loginName}
              onChange={(event) => setLoginName(event.target.value)}
              className={formInputClass}
              autoComplete="username"
              required
            />
          </label>
          <label className="block">
            <span className={formLabelClass}>Mật khẩu</span>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={formInputClass}
              autoComplete="current-password"
              required
            />
          </label>
        </div>

        {sessionNotice ? (
          <div className="mt-4 rounded-xl border border-warning/25 bg-warning-soft px-3 py-2 text-sm text-warning">
            {sessionNotice}
          </div>
        ) : null}

        {login.error || bootstrap.error ? (
          <div className="mt-4 rounded-xl border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">
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
