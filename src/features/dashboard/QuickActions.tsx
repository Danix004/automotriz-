import { Link } from 'react-router-dom';
import { ArrowRight, Package, Search, Settings2 } from 'lucide-react';
import { paths } from '@/routes/paths';
import { cn } from '@/utils/cn';

interface QuickAction {
  label: string;
  description: string;
  to: string;
  icon: React.ElementType;
  accent: string;
}

const ACTIONS: QuickAction[] = [
  {
    label: 'Agregar equipamiento',
    description: 'Nuevo producto o accesorio',
    to: paths.productNew,
    icon: Package,
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'Buscador global',
    description: 'Encuentra productos al instante',
    to: paths.search,
    icon: Search,
    accent: 'from-violet-500 to-fuchsia-500',
  },
  {
    label: 'Gestionar catálogo',
    description: 'Productos y categorías',
    to: paths.products,
    icon: Settings2,
    accent: 'from-amber-500 to-orange-500',
  },
];

/** Accesos rápidos del dashboard. */
export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.label}
          to={action.to}
          className="group flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 shadow-card dark:shadow-card-dark transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
              action.accent,
            )}
          >
            <action.icon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{action.label}</span>
            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{action.description}</span>
          </span>
          <ArrowRight className="ml-auto hidden h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
        </Link>
      ))}
    </div>
  );
}
