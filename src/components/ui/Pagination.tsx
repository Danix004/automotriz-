import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Select } from '@/components/ui/Input';
import { PAGE_SIZE_OPTIONS } from '@/types/constants';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

function pageWindow(page: number, totalPages: number): number[] {
  const maxButtons = 5;
  let start = Math.max(1, page - Math.floor(maxButtons / 2));
  const end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className={cn('flex flex-col items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:flex-row', className)}>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Mostrando <span className="font-medium text-slate-700 dark:text-slate-200">{from}</span>–
        <span className="font-medium text-slate-700 dark:text-slate-200">{to}</span> de{' '}
        <span className="font-medium text-slate-700 dark:text-slate-200">{total}</span> registros
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onPageSizeChange && (
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            Por página
            <Select
              value={String(pageSize)}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-8 w-20 text-xs"
              aria-label="Registros por página"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </label>
        )}

        <nav className="flex items-center gap-1" aria-label="Paginación">
          <PageButton disabled={page <= 1} onClick={() => onPageChange(1)} label="Primera página">
            <ChevronsLeft className="h-4 w-4" />
          </PageButton>
          <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)} label="Página anterior">
            <ChevronLeft className="h-4 w-4" />
          </PageButton>

          {pageWindow(page, totalPages).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onPageChange(value)}
              aria-current={value === page ? 'page' : undefined}
              className={cn(
                'h-8 min-w-8 rounded-lg px-2 text-xs font-medium transition-colors',
                value === page
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
            >
              {value}
            </button>
          ))}

          <PageButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} label="Página siguiente">
            <ChevronRight className="h-4 w-4" />
          </PageButton>
          <PageButton disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} label="Última página">
            <ChevronsRight className="h-4 w-4" />
          </PageButton>
        </nav>
      </div>
    </div>
  );
}

function PageButton({
  children,
  disabled,
  onClick,
  label,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
