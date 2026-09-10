'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { activateClubOwner } from '@/services/auth-service';

export function OwnerActivationPageClient() {
  const searchParams = useSearchParams();
  const [clubCode] = useState(() => searchParams.get('club')?.trim().toLowerCase() ?? '');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    setToken(fragment.get('token') ?? '');
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setPending(true);
    try {
      await activateClubOwner({ clubCode, token, password });
      setComplete(true);
      setPassword('');
      setConfirmPassword('');
      setToken('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể kích hoạt tài khoản OWNER.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-md">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck /></div>
          <div><p className="text-xs uppercase tracking-[0.2em] text-info">Badmin</p><h1 className="text-xl font-semibold">Kích hoạt Chủ CLB</h1></div>
        </div>
        {complete ? (
          <div className="mt-6 space-y-4">
            <div className="flex gap-2 rounded-xl border border-success/30 bg-success-soft p-3 text-sm text-success"><CheckCircle2 className="h-5 w-5 shrink-0" />Tài khoản OWNER đã được kích hoạt.</div>
            <p className="text-sm text-muted-foreground">Mã CLB đăng nhập: <strong className="text-foreground">{clubCode}</strong></p>
            <Link href="/login" className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary-hover">Đến trang đăng nhập</Link>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
            <div className="rounded-xl bg-surface-muted px-3 py-2 text-sm">Mã CLB: <strong>{clubCode || 'Không hợp lệ'}</strong></div>
            <label className="block"><span className={formLabelClass}>Mật khẩu mới</span><Input type="password" autoComplete="new-password" className={formInputClass} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
            <label className="block"><span className={formLabelClass}>Xác nhận mật khẩu</span><Input type="password" autoComplete="new-password" className={formInputClass} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required /></label>
            {error ? <div className="rounded-xl border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div> : null}
            <Button type="submit" disabled={pending || !clubCode || !token} className="h-12 w-full">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Kích hoạt OWNER</Button>
          </form>
        )}
      </section>
    </main>
  );
}
