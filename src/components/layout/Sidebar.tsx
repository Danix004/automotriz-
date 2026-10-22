import { NavLink, useLocation } from 'react-router-dom';
import {
  Car,
  ChevronLeft,
  Cog,
  Gauge,
  Package,
  Receipt,
  Search,
  ShoppingCart,
  Tags,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { paths } from '@/routes/paths';
import { useUIStore } from '@/store/uiStore';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', to: paths.dashboard, icon: Gauge },
      { label: 'Buscador global', to: paths.search, icon: Search },
    ],
  },
  {
    label: 'Equipamientos',
    items: [
      { label: 'Productos', to: paths.products, icon: Package },
      { label: 'Categorías', to: paths.categories, icon: Tags },
    ],
  },
  {
    label: 'Ventas',
    items: [
      { label: 'Caja', to: paths.cashRegister, icon: ShoppingCart },
      { label: 'Reporte de ventas', to: paths.sales, icon: Receipt },
    ],
  },
  {
    label: 'Administración',
    items: [
      { label: 'Usuarios', to: paths.users, icon: Users },
      { label: 'Configuración', to: paths.settings, icon: Cog },
    ],
  },
];

interface SidebarProps {
  variant?: 'desktop' | 'mobile';
  onClose?: () => void;
}

export function Sidebar({ variant = 'desktop', onClose }: SidebarProps) {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const location = useLocation();

  const expanded = variant === 'desktop' ? sidebarOpen : true;

  return (
    <aside
      className={cn(
        'z-40 flex h-full flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-[width] duration-200',
        variant === 'desktop' && (expanded ? 'w-64' : 'w-[76px]'),
      )}
    >
      {/* Marca */}
      <div className={cn('flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 px-4', !expanded && 'justify-center px-0')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-sm">
          <Car className="h-5 w-5" />
        </div>
        {expanded && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">AutoEquip Pro</p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">Catálogo de equipamientos</p>
          </div>
        )}
        {variant === 'mobile' && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            {expanded && (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.label}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.to === paths.dashboard
                    ? location.pathname === paths.dashboard
                    : location.pathname.startsWith(item.to.split('?')[0]) && item.to.split('?')[0] !== '/';
                return (
                  <li key={item.label}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      title={!expanded ? item.label : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                        !expanded && 'justify-center px-0',
                        isActive
                          ? 'bg-primary/12 text-primary dark:bg-primary/20 dark:text-primary-300'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100',
                      )}
                    >
                      <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-primary')} />
                      {expanded && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Colapsar (solo desktop) */}
      {variant === 'desktop' && (
        <div className="border-t border-slate-200 dark:border-slate-800 p-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800',
              !expanded && 'justify-center px-0',
            )}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', !expanded && 'rotate-180')} />
            {expanded && 'Colapsar'}
          </button>
        </div>
      )}
    </aside>
  );
}
