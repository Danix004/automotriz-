import type { ReactNode } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';

export interface FilterPanelProps {
  title?: string;
  children: ReactNode;
  onClear?: () => void;
  activeCount?: number;
  className?: string;
  /** Se muestra colapsado en móvil y expandido en desktop. */
  defaultOpen?: boolean;
}

/** Contenedor de filtros con contador de activos y acción de limpiar. */
export function FilterPanel({
  title = 'Filtros',
  children,
  onClear,
  activeCount = 0,
  className,
  defaultOpen = true,
}: FilterPanelProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        'group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 open:shadow-card dark:open:shadow-card-dark',
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          {title}
          {activeCount > 0 && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {activeCount}
            </span>
          )}
        </span>
        <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▾</span>
      </summary>

      <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
        {onClear && activeCount > 0 && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              icon={<X className="h-3.5 w-3.5" />}
              onClick={onClear}
            >
              Limpiar filtros ({activeCount})
            </Button>
          </div>
        )}
      </div>
    </details>
  );
}
