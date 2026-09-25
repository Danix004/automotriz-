import { useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useToastStore, type ToastVariant } from '@/store/toastStore';
import { cn } from '@/utils/cn';

const icons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-success" />,
  error: <XCircle className="h-5 w-5 text-danger" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  info: <Info className="h-5 w-5 text-secondary" />,
};

const accent: Record<ToastVariant, string> = {
  success: 'border-l-success',
  error: 'border-l-danger',
  warning: 'border-l-warning',
  info: 'border-l-secondary',
};

/** Pila de notificaciones flotantes. */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:w-96">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-l-4 border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 p-3.5 shadow-xl backdrop-blur animate-slide-up',
            accent[toast.variant],
          )}
        >
          <div className="mt-0.5 shrink-0">{icons[toast.variant]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{toast.title}</p>
            {toast.description && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{toast.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Cerrar notificación"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Pestañas controladas reutilizables. */
export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
}) {
  const [internal, setInternal] = useState(items[0]?.id ?? '');
  const active = value ?? internal;
  const select = (id: string) => {
    if (onChange) onChange(id);
    else setInternal(id);
  };
  const current = items.find((item) => item.id === active) ?? items[0];

  return (
    <div className={className}>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => select(item.id)}
            className={cn(
              'relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
              item.id === active
                ? 'text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
            )}
          >
            {item.label}
            {typeof item.count === 'number' && (
              <span className="ml-2 rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[11px]">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="pt-4">
        <div key={String(current?.id)} className="animate-fade-in">
          {current?.content}
        </div>
      </div>
    </div>
  );
}
