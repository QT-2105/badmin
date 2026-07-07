import { AppShell } from '@/components/app-shell';
import { AuthUsersPanel } from '@/components/users/auth-users-panel';
import { requirePageUser } from '@/lib/auth/guards';

export default async function UsersPage() {
  await requirePageUser('/users');
  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 md:px-6">
        <header>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">User access</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">User</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Quản lý tài khoản nội bộ, trạng thái đăng nhập và phân quyền thao tác trên chương trình. Mục này không quản lý người chơi trong từng ca.
          </p>
        </header>
        <AuthUsersPanel />
      </main>
    </AppShell>
  );
}
