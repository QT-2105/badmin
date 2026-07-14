import { AppShell } from '@/components/app-shell';
import { AuthUsersPanel } from '@/components/users/auth-users-panel';
import { PageHeader, PageShell } from '@/components/ui/page-layout';
import { requirePageUser } from '@/lib/auth/guards';

export default async function UsersPage() {
  await requirePageUser('/users');
  return (
    <AppShell>
      <PageShell>
        <PageHeader
          eyebrow="User access"
          title="User"
          description="Tạo tài khoản đăng nhập, chỉnh quyền theo role và khóa/mở quyền thao tác các màn hình quan trọng. User hệ thống tách biệt hoàn toàn với người chơi trong từng ca."
        />
        <AuthUsersPanel />
      </PageShell>
    </AppShell>
  );
}
