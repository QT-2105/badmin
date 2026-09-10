import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteBrandingLogo,
  fetchBranding,
  updateBrandingName,
  uploadBrandingLogo
} from '@/services/branding-service';
import { tenantQueryKey, useTenantRoute } from '@/components/tenant/tenant-app-provider';

export function useBranding() {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'settings', 'branding'),
    queryFn: ({ signal }) => fetchBranding(signal)
  });
}

export function useBrandingMutations() {
  const { clubId } = useTenantRoute();
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'settings', 'branding') });
  };

  return {
    updateName: useMutation({
      mutationFn: updateBrandingName,
      onSuccess: invalidate
    }),
    uploadLogo: useMutation({
      mutationFn: uploadBrandingLogo,
      onSuccess: invalidate
    }),
    deleteLogo: useMutation({
      mutationFn: deleteBrandingLogo,
      onSuccess: invalidate
    })
  };
}
