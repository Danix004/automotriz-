import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
  wrapperClassName?: string;
}

const baseControl =
  'w-full rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, icon, error, wrapperClassName, ...props },
  ref,
) {
  const control = (
    <input
      ref={ref}
      className={cn(baseControl, 'h-10 px-3 text-sm', icon && 'pl-9', error && 'border-danger focus:border-danger focus:ring-danger/25', className)}
      {...props}
    />
  );
  if (!icon) {
    return (
      <div className={cn('w-full', wrapperClassName)}>
        {control}
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
  return (
    <div className={cn('relative w-full', wrapperClassName)}>
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">{icon}</span>
      {control}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, ...props },
  ref,
) {
  return (
    <div className="w-full">
      <textarea
        ref={ref}
        className={cn(baseControl, 'min-h-[110px] px-3 py-2 text-sm', error && 'border-danger focus:border-danger focus:ring-danger/25', className)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, placeholder, children, ...props },
  ref,
) {
  return (
    <div className="w-full">
      <select
        ref={ref}
        className={cn(baseControl, 'h-10 px-3 pr-8 text-sm appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")] bg-[length:18px] bg-[right_0.6rem_center] bg-no-repeat', error && 'border-danger focus:border-danger focus:ring-danger/25', className)}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
});
