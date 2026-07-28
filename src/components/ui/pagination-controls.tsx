'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

export type PageSize = 10 | 20 | 50;

export const PAGE_SIZE_OPTIONS: PageSize[] = [10, 20, 50];

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  compact = false
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  compact?: boolean;
}) {
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(totalItems, safePage * pageSize);

  return (
    <div className={`${compact ? 'mt-2 px-2 py-1.5 sm:rounded-lg' : 'mt-3 px-3 py-3'} flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-surface-subtle text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between`}>
      <div className="min-w-0 font-medium">
        {compact ? (
          <span><span className="text-foreground">{start}-{end}</span> / {totalItems}</span>
        ) : (
          <span>Hiển thị <span className="text-foreground">{start}-{end}</span> / {totalItems}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={`${compact ? 'h-8 w-8 px-0' : 'h-10 px-3'} rounded-lg`}
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label={compact ? 'Trang trước' : undefined}
        >
          {compact ? <ChevronLeft className="h-4 w-4" aria-hidden="true" /> : 'Trước'}
        </Button>
        <span className={`${compact ? 'h-8 min-w-10 px-2' : 'h-10 min-w-14 px-3'} inline-flex items-center justify-center rounded-lg border border-border bg-background font-semibold text-foreground`}>
          {safePage}/{totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={`${compact ? 'h-8 w-8 px-0' : 'h-10 px-3'} rounded-lg`}
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label={compact ? 'Trang sau' : undefined}
        >
          {compact ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : 'Sau'}
        </Button>
      </div>
    </div>
  );
}
