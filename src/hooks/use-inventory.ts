import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createMovement, createProduct, deleteProduct, fetchMovements, fetchProductOptions, fetchProducts, updateProduct } from '@/services/inventory-service';
import { tenantQueryKey, useTenantRoute } from '@/components/tenant/tenant-app-provider';

export function useInventoryProducts() {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'inventory', 'products'),
    queryFn: ({ signal }) => fetchProducts(signal)
  });
}

export function useShuttlecockProductOptions(sessionId: string) {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'inventory', 'product-options', sessionId),
    queryFn: ({ signal }) => fetchProductOptions(sessionId, signal),
    enabled: Boolean(sessionId)
  });
}

export function useInventoryMovements() {
  const { clubId } = useTenantRoute();
  return useQuery({
    queryKey: tenantQueryKey(clubId, 'inventory', 'movements'),
    queryFn: ({ signal }) => fetchMovements(signal)
  });
}

export function useInventoryMutations() {
  const { clubId } = useTenantRoute();
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'inventory', 'products') }),
      queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'inventory', 'product-options') }),
      queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'inventory', 'movements') }),
      queryClient.invalidateQueries({ queryKey: tenantQueryKey(clubId, 'dashboard', 'summary') })
    ]);
  };

  return {
    createProduct: useMutation({ mutationFn: createProduct, onSuccess: invalidate }),
    updateProduct: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateProduct>[1] }) => updateProduct(id, payload), onSuccess: invalidate }),
    deleteProduct: useMutation({ mutationFn: deleteProduct, onSuccess: invalidate }),
    createMovement: useMutation({ mutationFn: createMovement, onSuccess: invalidate })
  };
}
