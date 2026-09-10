import { redirectLegacyPage } from '@/lib/auth/guards';

export default function HomePage() {
  return redirectLegacyPage('/dashboard');
}
