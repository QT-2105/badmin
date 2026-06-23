import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteBrandingLogo,
  fetchBranding,
  updateBrandingName,
  uploadBrandingLogo
} from '@/services/branding-service';

export function useBranding() {
  return useQuery({
    queryKey: ['settings', 'branding'],
    queryFn: ({ signal }) => fetchBranding(signal)
  });
}

export function useBrandingMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['settings', 'branding'] });
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
