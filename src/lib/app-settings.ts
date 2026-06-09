export type AppSettings = {
  autoCreateCourtFeeTransaction: boolean;
  autoCreateShuttlecockUsageTransaction: boolean;
  maxCourtCountPerSession: number;
};

export const defaultAppSettings: AppSettings = {
  autoCreateCourtFeeTransaction: false,
  autoCreateShuttlecockUsageTransaction: true,
  maxCourtCountPerSession: 3
};

export const appSettingsStorageKey = 'badmin_app_settings';

export function readAppSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultAppSettings;

  try {
    const raw = window.localStorage.getItem(appSettingsStorageKey);
    if (!raw) return defaultAppSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      autoCreateCourtFeeTransaction: parsed.autoCreateCourtFeeTransaction ?? defaultAppSettings.autoCreateCourtFeeTransaction,
      autoCreateShuttlecockUsageTransaction: parsed.autoCreateShuttlecockUsageTransaction ?? defaultAppSettings.autoCreateShuttlecockUsageTransaction,
      maxCourtCountPerSession: normalizeMaxCourtCount(parsed.maxCourtCountPerSession)
    };
  } catch {
    return defaultAppSettings;
  }
}

export function writeAppSettings(settings: AppSettings): void {
  window.localStorage.setItem(appSettingsStorageKey, JSON.stringify({
    ...settings,
    maxCourtCountPerSession: normalizeMaxCourtCount(settings.maxCourtCountPerSession)
  }));
}

export function normalizeMaxCourtCount(value: unknown): number {
  const numberValue = Math.floor(Number(value));
  if (!Number.isFinite(numberValue)) return defaultAppSettings.maxCourtCountPerSession;
  return Math.max(1, Math.min(12, numberValue));
}
