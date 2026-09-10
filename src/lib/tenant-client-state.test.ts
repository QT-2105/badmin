import { afterEach, describe, expect, it, vi } from 'vitest';

import { useBadmintonStore } from './badminton-store';
import { clearTenantClientState } from './tenant-client-state';
import { tenantAppSettingsStorageKey, tenantRuntimeSessionStorageKey } from './tenant-storage-keys';

describe('tenant logout client cleanup', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('clears runtime state and only the current tenant operational keys', () => {
    const values = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key)
    };
    vi.stubGlobal('window', { localStorage });

    const currentClubId = 'club-a';
    const otherClubId = 'club-b';
    values.set(tenantRuntimeSessionStorageKey(currentClubId), 'session-a');
    values.set(tenantAppSettingsStorageKey(currentClubId), '{}');
    values.set(tenantRuntimeSessionStorageKey(otherClubId), 'session-b');
    values.set('badmin_active_session_id', 'legacy-session');
    values.set('badmin_app_settings', '{}');
    values.set('badmin_theme', 'dark');
    useBadmintonStore.setState({ runtimeSessionId: 'session-a', runtimeVersion: 8 });

    clearTenantClientState(currentClubId);

    expect(useBadmintonStore.getState()).toMatchObject({ runtimeSessionId: null, runtimeVersion: 0 });
    expect(values.has(tenantRuntimeSessionStorageKey(currentClubId))).toBe(false);
    expect(values.has(tenantAppSettingsStorageKey(currentClubId))).toBe(false);
    expect(values.get(tenantRuntimeSessionStorageKey(otherClubId))).toBe('session-b');
    expect(values.has('badmin_active_session_id')).toBe(false);
    expect(values.has('badmin_app_settings')).toBe(false);
    expect(values.get('badmin_theme')).toBe('dark');
  });
});
