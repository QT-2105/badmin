export function tenantRuntimeSessionStorageKey(clubId: string): string {
  return `badmin:${clubId}:active_session_id`;
}

export function tenantAppSettingsStorageKey(clubId: string): string {
  return `badmin:${clubId}:app_settings`;
}
