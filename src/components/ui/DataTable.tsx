import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react';
import { cn } from '@/utils/cn';
import { TableSkeleton } from '@/components/ui/States';
import { Pagination, type PaginationProps } from '@/components/ui/Pagination';

export type SortDirection = 'asc' | 'desc';

export interface Column<T> {
  key: string;
  header: ReactNode;
  accessor?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  /** Clases responsive para ocultar en pantallas pequeñas. */
  hideOn?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface DataTableProps<T> {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  empty?: ReactNode;
  sortField?: string;
  sortDirection?: SortDirection;
  onSort?: (field: string) => void;
  onRowClick?: (row: T) => void;
  pagination?: PaginationProps;
  dense?: boolean;
  className?: string;
}

const hideClasses: Record<string, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
};

const alignClasses = { left: 'text-left', center: 'text-center', right: 'text-right' };

/** Tabla genérica: ordenamiento, paginación, estados de carga y vacío. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  empty,
  sortField,
  sortDirection = 'asc',
  onSort,
  onRowClick,
  pagination,
  dense = false,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={cn('overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800', className)}>
        <TableSkeleton rows={Math.min(rows.length || 6, 8)} cols={Math.min(columns.length, 6)} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cn('overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70', className)}>
        {empty ?? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Inbox className="h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No hay registros</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ajusta los filtros o agrega un nuevo registro para comenzar.
            </p>
          </div>
        )}
        {pagination && rows.length === 0 ? null : null}
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              {columns.map((column) => {
                const active = sortField === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    className={cn(
                      'px-4 py-3 font-semibold text-slate-600 dark:text-slate-300',
                      alignClasses[column.align ?? 'left'],
                      column.hideOn && hideClasses[column.hideOn],
                    )}
                  >
                    {column.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.key)}
                        className={cn(
                          'inline-flex items-center gap-1.5 uppercase tracking-wide text-xs transition-colors hover:text-primary',
                          active && 'text-primary',
                        )}
                      >
                        {column.header}
                        {active ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-slate-100 dark:border-slate-800/70 last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  rowIndex % 2 === 1 && 'bg-slate-50/60 dark:bg-slate-800/20',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      dense ? 'px-3 py-2' : 'px-4 py-3',
                      'align-middle text-slate-700 dark:text-slate-200',
                      alignClasses[column.align ?? 'left'],
                      column.hideOn && hideClasses[column.hideOn],
                    )}
                  >
                    {column.accessor ? column.accessor(row) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && <Pagination {...pagination} />}
    </div>
  );
}
