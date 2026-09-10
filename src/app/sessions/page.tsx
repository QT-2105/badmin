import { redirectLegacyPage } from '@/lib/auth/guards';

export default function SessionsIndexPage() {
  return redirectLegacyPage('/schedule');
}
