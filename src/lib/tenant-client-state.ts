import { clearTenantRuntimeState } from '@/lib/badminton-store';
import { tenantAppSettingsStorageKey, tenantRuntimeSessionStorageKey } from '@/lib/tenant-storage-keys';

export function clearTenantClientState(clubId: string): void {
  clearTenantRuntimeState();
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(tenantRuntimeSessionStorageKey(clubId));
  window.localStorage.removeItem(tenantAppSettingsStorageKey(clubId));
  window.localStorage.removeItem('badmin_active_session_id');
  window.localStorage.removeItem('badmin_app_settings');
}
