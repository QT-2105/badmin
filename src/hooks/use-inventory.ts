import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createMovement, createProduct, deleteProduct, fetchMovements, fetchProductOptions, fetchProducts, updateProduct } from '@/services/inventory-service';

export function useInventoryProducts() {
  return useQuery({
    queryKey: ['inventory', 'products'],
    queryFn: ({ signal }) => fetchProducts(signal)
  });
}

export function useShuttlecockProductOptions() {
  return useQuery({
    queryKey: ['inventory', 'product-options'],
    queryFn: ({ signal }) => fetchProductOptions(signal)
  });
}

export function useInventoryMovements() {
  return useQuery({
    queryKey: ['inventory', 'movements'],
    queryFn: ({ signal }) => fetchMovements(signal)
  });
}

export function useInventoryMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory', 'product-options'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory', 'movements'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    ]);
  };

  return {
    createProduct: useMutation({ mutationFn: createProduct, onSuccess: invalidate }),
    updateProduct: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateProduct>[1] }) => updateProduct(id, payload), onSuccess: invalidate }),
    deleteProduct: useMutation({ mutationFn: deleteProduct, onSuccess: invalidate }),
    createMovement: useMutation({ mutationFn: createMovement, onSuccess: invalidate })
  };
}
