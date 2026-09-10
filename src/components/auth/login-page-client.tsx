'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';

import { consumeSessionExpiredNotice } from '@/components/auth/auth-session-boundary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { formInputClass, formLabelClass } from '@/components/ui/page-layout';
import { useLoginClubLookup, useLoginMutation } from '@/hooks/use-auth';
import type { LoginVisibleClub } from '@/services/auth-service';

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLoginMutation();
  const [clubQuery, setClubQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<LoginVisibleClub | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [sessionNotice] = useState(() => consumeSessionExpiredNotice(searchParams));
  const next = searchParams.get('next');
  const { data: clubSuggestions = [], isFetching: clubsLoading } = useLoginClubLookup(selectedClub ? '' : clubQuery);

  useEffect(() => {
    if (!selectedClub && !clubQuery && clubSuggestions.length === 1) {
      setSelectedClub(clubSuggestions[0]);
      setClubQuery(`${clubSuggestions[0].name} (${clubSuggestions[0].code})`);
    }
  }, [clubQuery, clubSuggestions, selectedClub]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClub) return;
    await login.mutateAsync({ clubCode: selectedClub.code, identifier, password });
    const defaultTarget = selectedClub ? `/${selectedClub.code}/dashboard` : '/dashboard';
    const safeTarget = next?.startsWith('/') && !next.startsWith('//') ? next : defaultTarget;
    router.push(safeTarget as Route);
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <form onSubmit={(event) => void submit(event)} className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-md">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">B</div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-info">Badmin</p>
            <h1 className="text-xl font-semibold text-foreground">{selectedClub?.name || 'Đăng nhập vận hành'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Đăng nhập để sử dụng chương trình.</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <label className="relative block">
            <span className={formLabelClass}>Mã hoặc tên CLB</span>
            <Input
              type="text"
              value={clubQuery}
              onChange={(event) => {
                setClubQuery(event.target.value);
                setSelectedClub(null);
              }}
              className={formInputClass}
              autoComplete="organization"
              placeholder="Nhập mã hoặc tên CLB"
              required
            />
            {!selectedClub && clubQuery.trim() && clubSuggestions.length > 0 ? (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                {clubSuggestions.map((club) => (
                  <button
                    key={club.code}
                    type="button"
                    onClick={() => {
                      setSelectedClub(club);
                      setClubQuery(`${club.name} (${club.code})`);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-surface-muted"
                  >
                    <span className="font-medium text-foreground">{club.name}</span>
                    <span className="text-xs text-muted-foreground">{club.code}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {!selectedClub && clubQuery.trim() && !clubsLoading && clubSuggestions.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">Không tìm thấy CLB phù hợp.</p>
            ) : null}
          </label>
          <label className="block">
            <span className={formLabelClass}>Username, email hoặc số điện thoại</span>
            <Input
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
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

        {login.error ? (
          <div className="mt-4 rounded-xl border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">
            {login.error.message}
          </div>
        ) : null}

        <Button type="submit" disabled={!selectedClub || login.isPending} className="mt-5 h-12 w-full rounded-xl">
          {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Đăng nhập
        </Button>
      </form>
    </main>
  );
}
