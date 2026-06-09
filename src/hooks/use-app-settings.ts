'use client';

import { useEffect, useState } from 'react';

import { defaultAppSettings, readAppSettings, writeAppSettings, type AppSettings } from '@/lib/app-settings';

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);

  useEffect(() => {
    setSettings(readAppSettings());
  }, []);

  function updateSettings(nextSettings: AppSettings) {
    setSettings(nextSettings);
    writeAppSettings(nextSettings);
  }

  function setSetting<Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) {
    updateSettings({ ...settings, [key]: value });
  }

  return { settings, setSetting, updateSettings };
}
