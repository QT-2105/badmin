import type { ShuttlecockMovementSummary, ShuttlecockProductOption, ShuttlecockProductSummary } from '@/types/domain';

export async function fetchProducts(signal?: AbortSignal): Promise<ShuttlecockProductSummary[]> {
  const res = await fetch('/api/inventory/products', { signal, cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load inventory');
  const data = (await res.json()) as { products: ShuttlecockProductSummary[] };
  return data.products;
}

export async function fetchProductOptions(signal?: AbortSignal): Promise<ShuttlecockProductOption[]> {
  const res = await fetch('/api/inventory/products?view=options', { signal, cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load shuttlecock products');
  const data = (await res.json()) as { products: ShuttlecockProductOption[] };
  return data.products;
}

export async function createProduct(payload: {
  name: string;
  brand?: string;
  ballsPerTube?: number;
  status?: string;
}): Promise<ShuttlecockProductSummary> {
  const res = await fetch('/api/inventory/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || 'Failed to create product');
  }
  const data = (await res.json()) as { product: ShuttlecockProductSummary };
  return data.product;
}

export async function updateProduct(productId: string, payload: {
  name?: string;
  brand?: string;
  ballsPerTube?: number;
  status?: string;
}): Promise<ShuttlecockProductSummary> {
  const res = await fetch(`/api/inventory/products/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || 'Failed to update product');
  }
  return ((await res.json()) as { product: ShuttlecockProductSummary }).product;
}

export async function deleteProduct(productId: string): Promise<void> {
  const res = await fetch(`/api/inventory/products/${productId}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || 'Failed to delete product');
  }
}

export async function fetchMovements(signal?: AbortSignal): Promise<ShuttlecockMovementSummary[]> {
  const res = await fetch('/api/inventory/movements', { signal, cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load inventory movements');
  return ((await res.json()) as { movements: ShuttlecockMovementSummary[] }).movements;
}

export async function createMovement(payload: {
  productId: string;
  movementType: string;
  title?: string;
  quantityTube?: number;
  quantityBall?: number;
  actualQuantityBall?: number;
  costPricePerTube?: number;
  usagePricePerTube?: number;
  salePricePerTube?: number;
  note?: string;
}): Promise<void> {
  const res = await fetch('/api/inventory/movements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || 'Failed to create movement');
  }
}
