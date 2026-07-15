'use client';

import { Button } from '@/components/ui/button';

export type PageSize = 10 | 20 | 50;

export const PAGE_SIZE_OPTIONS: PageSize[] = [10, 20, 50];

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(totalItems, safePage * pageSize);

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-surface-subtle px-3 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="font-medium">
        Hiển thị <span className="text-foreground">{start}-{end}</span> / {totalItems}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" size="sm" className="h-9 rounded-lg px-3" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}>
          Trước
        </Button>
        <span className="inline-flex h-9 min-w-14 items-center justify-center rounded-lg border border-border bg-background px-3 font-semibold text-foreground">
          {safePage}/{totalPages}
        </span>
        <Button type="button" variant="secondary" size="sm" className="h-9 rounded-lg px-3" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)}>
          Sau
        </Button>
      </div>
    </div>
  );
}
