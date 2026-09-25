import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'violet';
  delta?: number;
  hint?: string;
  to?: string;
}

const accents: Record<string, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary/12', text: 'text-primary' },
  secondary: { bg: 'bg-secondary/12', text: 'text-secondary' },
  success: { bg: 'bg-success/12', text: 'text-success' },
  warning: { bg: 'bg-warning/12', text: 'text-warning' },
  danger: { bg: 'bg-danger/12', text: 'text-danger' },
  violet: { bg: 'bg-violet-500/12', text: 'text-violet-500' },
};

export function StatCard({ label, value, icon: Icon, accent = 'primary', delta, hint, to }: StatCardProps) {
  const palette = accents[accent] ?? accents.primary;

  const content = (
    <div
      className={cn(
        'group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5',
        'shadow-card dark:shadow-card-dark transition-all hover:-translate-y-0.5 hover:shadow-lg',
        to && 'cursor-pointer',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', palette.bg, palette.text)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {typeof delta === 'number' && (
          <span className={cn('inline-flex items-center gap-1 font-medium', delta >= 0 ? 'text-success' : 'text-danger')}>
            {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="truncate text-slate-400 dark:text-slate-500">{hint}</span>}
      </div>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

/** Bloque de métrica dentro de tarjetas más grandes. */
export function MiniStat({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {icon}
        {value}
      </span>
    </div>
  );
}
