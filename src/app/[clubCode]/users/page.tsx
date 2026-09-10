import { AppShell } from '@/components/app-shell';
import { PageHeader, PageShell } from '@/components/ui/page-layout';
import { AuthUsersPanel } from '@/components/users/auth-users-panel';
import { requireTenantPageUser } from '@/lib/auth/guards';

export default async function TenantUsersPage({ params }: { params: Promise<{ clubCode: string }> }) {
  const { clubCode } = await params;
  await requireTenantPageUser(clubCode, '/users');
  return (
    <AppShell>
      <PageShell className="gap-4 md:gap-5" maxWidth="max-w-[1920px]">
        <PageHeader eyebrow="Quản lý truy cập" title="Người dùng" description="Quản lý tài khoản nội bộ, vai trò cố định và quyền thao tác theo từng nhóm chức năng." />
        <AuthUsersPanel />
      </PageShell>
    </AppShell>
  );
}
