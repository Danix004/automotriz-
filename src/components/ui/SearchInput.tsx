import { forwardRef, useEffect, useState, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onValueChange: (value: string) => void;
  debounceMs?: number;
  /** Mantiene el valor local y emite con debounce (para controlar URL). */
  controlled?: boolean;
}

/**
 * Input de búsqueda con debounce integrado.
 * El valor visible cambia al instante; `onValueChange` emite tras `debounceMs`.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onValueChange, debounceMs = 350, className, placeholder = 'Buscar…', controlled = true, ...props },
  ref,
) {
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);

  useEffect(() => {
    if (!controlled) return;
    if (local === value) return;
    const timer = window.setTimeout(() => onValueChange(local), debounceMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, debounceMs]);

  return (
    <div className={cn('relative w-full', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={ref}
        type="search"
        value={local}
        placeholder={placeholder}
        onChange={(event) => setLocal(event.target.value)}
        className={cn(
          'h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-9 text-sm text-slate-900 dark:text-slate-100',
          'placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors',
          'focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
        {...props}
      />
      {local && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => {
            setLocal('');
            onValueChange('');
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});
