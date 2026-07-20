import { AppShell } from '@/components/app-shell';
import { AuthUsersPanel } from '@/components/users/auth-users-panel';
import { PageHeader, PageShell } from '@/components/ui/page-layout';
import { requirePageUser } from '@/lib/auth/guards';

export default async function UsersPage() {
  await requirePageUser('/users');
  return (
    <AppShell>
      <PageShell className="gap-4 md:gap-5" maxWidth="max-w-7xl">
        <PageHeader
          eyebrow="Quản lý truy cập"
          title="Người dùng"
          description="Quản lý tài khoản nội bộ, vai trò cố định và quyền thao tác theo từng nhóm chức năng."
        />
        <AuthUsersPanel />
      </PageShell>
    </AppShell>
  );
}
