import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';

import { cn } from '@/lib/utils';

import { EmptyState, ErrorState, LoadingState } from './feedback';

type DataTableAlign = 'left' | 'center' | 'right';
type DataTableDensity = 'compact' | 'default' | 'comfortable';

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  align?: DataTableAlign;
  width?: string;
  className?: string;
  headerClassName?: string;
  cellClassName?: string | ((row: Row) => string | undefined);
  render: (row: Row, rowIndex: number) => ReactNode;
};

export type DataTableState = {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
};

export type DataTableProps<Row> = {
  rows: Row[];
  columns: DataTableColumn<Row>[];
  getRowKey: (row: Row, rowIndex: number) => string;
  actions?: (row: Row, rowIndex: number) => ReactNode;
  loading?: boolean;
  error?: boolean;
  loadingState?: ReactNode;
  emptyState?: ReactNode | DataTableState;
  errorState?: ReactNode | DataTableState;
  pagination?: ReactNode;
  density?: DataTableDensity;
  minWidth?: string;
  className?: string;
  tableClassName?: string;
  rowClassName?: string | ((row: Row, rowIndex: number) => string | undefined);
  'aria-label'?: string;
};

const alignStyles: Record<DataTableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right tabular-nums'
};

const densityStyles: Record<DataTableDensity, { header: string; cell: string }> = {
  compact: {
    header: 'px-3 py-2 text-xs',
    cell: 'px-3 py-2 text-sm'
  },
  default: {
    header: 'px-4 py-3 text-xs',
    cell: 'px-4 py-3 text-sm'
  },
  comfortable: {
    header: 'px-4 py-4 text-sm',
    cell: 'px-4 py-4 text-base'
  }
};

function isTableState(state: ReactNode | DataTableState): state is DataTableState {
  return typeof state === 'object' && state !== null && !isValidElement(state) && 'title' in state;
}

function renderState(state: ReactNode | DataTableState | undefined, fallback: DataTableState, variant: 'loading' | 'empty' | 'error') {
  const resolvedState = state ?? fallback;

  if (!isTableState(resolvedState)) {
    return resolvedState;
  }

  if (variant === 'loading') {
    return <LoadingState {...resolvedState} />;
  }

  if (variant === 'error') {
    return <ErrorState {...resolvedState} />;
  }

  return <EmptyState {...resolvedState} />;
}

export function DataTable<Row>({
  rows,
  columns,
  getRowKey,
  actions,
  loading = false,
  error = false,
  loadingState,
  emptyState,
  errorState,
  pagination,
  density = 'default',
  minWidth = '720px',
  className,
  tableClassName,
  rowClassName,
  'aria-label': ariaLabel
}: DataTableProps<Row>) {
  const stateColumnSpan = columns.length + (actions ? 1 : 0);
  const densityStyle = densityStyles[density];

  const tableState = loading
    ? renderState(loadingState, { title: 'Đang tải dữ liệu' }, 'loading')
    : error
      ? renderState(errorState, { title: 'Không thể tải dữ liệu', description: 'Vui lòng thử lại sau.' }, 'error')
      : rows.length === 0
        ? renderState(emptyState, { title: 'Chưa có dữ liệu' }, 'empty')
        : null;

  return (
    <div className={cn('rounded-xl border border-border bg-surface shadow-soft', className)}>
      <div className="operational-x-scroll">
        <table aria-busy={loading || undefined} aria-label={ariaLabel} className={cn('w-full border-collapse', tableClassName)} style={{ minWidth }}>
          <thead>
            <tr className="border-b border-border bg-surface-subtle">
              {columns.map((column) => {
                const align = column.align ?? 'left';
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      'font-semibold leading-snug text-muted-foreground',
                      densityStyle.header,
                      alignStyles[align],
                      column.className,
                      column.headerClassName
                    )}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.header}
                  </th>
                );
              })}
              {actions ? (
                <th scope="col" className={cn('w-1 whitespace-nowrap font-semibold leading-snug text-muted-foreground', densityStyle.header, alignStyles.right)}>
                  <span className="sr-only">Thao tác</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {tableState ? (
              <tr>
                <td className="p-4" colSpan={stateColumnSpan}>
                  {tableState}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => {
                const resolvedRowClassName = typeof rowClassName === 'function' ? rowClassName(row, rowIndex) : rowClassName;
                return (
                  <tr key={getRowKey(row, rowIndex)} className={cn('border-b border-border last:border-b-0 hover:bg-surface-hover/60', resolvedRowClassName)}>
                    {columns.map((column) => {
                      const align = column.align ?? 'left';
                      const resolvedCellClassName = typeof column.cellClassName === 'function' ? column.cellClassName(row) : column.cellClassName;
                      return (
                        <td
                          key={column.key}
                          className={cn('align-middle text-foreground', densityStyle.cell, alignStyles[align], column.className, resolvedCellClassName)}
                          style={column.width ? { width: column.width } : undefined}
                        >
                          {column.render(row, rowIndex)}
                        </td>
                      );
                    })}
                    {actions ? (
                      <td className={cn('w-1 whitespace-nowrap align-middle', densityStyle.cell, alignStyles.right)}>
                        {actions(row, rowIndex)}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {pagination ? <div className="border-t border-border p-3">{pagination}</div> : null}
    </div>
  );
}
