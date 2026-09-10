import { describe, expect, it } from 'vitest';

import { tenantAppSettingsStorageKey, tenantRuntimeSessionStorageKey } from './tenant-storage-keys';

describe('tenant browser storage keys', () => {
  it('isolates runtime and settings state by club identity', () => {
    expect(tenantRuntimeSessionStorageKey('club-a')).not.toBe(tenantRuntimeSessionStorageKey('club-b'));
    expect(tenantAppSettingsStorageKey('club-a')).not.toBe(tenantAppSettingsStorageKey('club-b'));
    expect(tenantRuntimeSessionStorageKey('club-a')).not.toBe(tenantAppSettingsStorageKey('club-a'));
  });
});
