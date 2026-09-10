'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { defaultAppSettings, readAppSettings, writeAppSettings, type AppSettings } from '@/lib/app-settings';
import { fetchAppSettings, updateAppSettings as updateRemoteAppSettings } from '@/services/app-settings-service';
import { tenantQueryKey, useTenantRoute } from '@/components/tenant/tenant-app-provider';

export function useAppSettings() {
  const { clubId } = useTenantRoute();
  const appSettingsQueryKey = tenantQueryKey(clubId, 'settings', 'app');
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: appSettingsQueryKey,
    queryFn: ({ signal }) => fetchAppSettings(signal),
    initialData: () => readAppSettings(clubId)
  });
  const mutation = useMutation({
    mutationFn: updateRemoteAppSettings,
    onSuccess: (savedSettings) => {
      writeAppSettings(clubId, savedSettings);
      queryClient.setQueryData(appSettingsQueryKey, savedSettings);
    },
    onError: () => {
      const current = queryClient.getQueryData<AppSettings>(appSettingsQueryKey);
      if (current) writeAppSettings(clubId, current);
    }
  });

  const settings = query.data ?? defaultAppSettings;

  function updateSettings(nextSettings: AppSettings) {
    writeAppSettings(clubId, nextSettings);
    queryClient.setQueryData(appSettingsQueryKey, nextSettings);
    mutation.mutate(nextSettings);
  }

  function setSetting<Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) {
    updateSettings({ ...settings, [key]: value });
  }

  return {
    settings,
    setSetting,
    updateSettings,
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
    error: query.error ?? mutation.error
  };
}
