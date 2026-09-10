import { redirectLegacyPage } from '@/lib/auth/guards';

export default async function UsersPage() {
  return redirectLegacyPage('/users');
}
