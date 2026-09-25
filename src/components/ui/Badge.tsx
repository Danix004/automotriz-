import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const variants: Record<BadgeVariant, string> = {
  primary: 'bg-primary/15 text-primary-700 dark:text-primary-300',
  success: 'bg-success/15 text-success-600 dark:text-success-500',
  warning: 'bg-warning/15 text-warning-600 dark:text-warning-500',
  danger: 'bg-danger/15 text-danger-600 dark:text-danger-500',
  info: 'bg-secondary/15 text-secondary-600 dark:text-secondary-500',
  neutral: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ variant = 'neutral', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        variants[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ active, labels = ['Activo', 'Inactivo'] }: { active: boolean; labels?: [string, string] }) {
  return (
    <Badge variant={active ? 'success' : 'neutral'} dot>
      {active ? labels[0] : labels[1]}
    </Badge>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <Badge variant="danger" dot>Sin stock</Badge>;
  if (stock <= 5) return <Badge variant="warning" dot>Stock bajo ({stock})</Badge>;
  return <Badge variant="success" dot>En stock ({stock})</Badge>;
}

export function CategoryBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300',
        className,
      )}
    >
      {name}
    </span>
  );
}

export function Chip({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>): ReactNode {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 text-xs text-slate-600 dark:text-slate-300',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
