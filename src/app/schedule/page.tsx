import { redirectLegacyPage } from '@/lib/auth/guards';

export default async function SchedulePage() {
  return redirectLegacyPage('/schedule');
}
