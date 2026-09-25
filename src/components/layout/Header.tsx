import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Moon, Search, Settings, Sun, User } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { paths } from '@/routes/paths';
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from '@/components/ui/Dropdown';
import { useSettings } from '@/hooks/queries';
import { getInitials } from '@/utils/format';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const navigate = useNavigate();
  const { data: settings } = useSettings();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        aria-label="Abrir menú"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => navigate(paths.search)}
        className="hidden h-9 w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-slate-400 transition-colors hover:border-primary/40 md:flex"
      >
        <Search className="h-4 w-4" />
        Buscar vehículo, producto o marca…
        <kbd className="ml-auto rounded border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-400">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Link
          to={paths.search}
          aria-label="Buscar"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
        >
          <Search className="h-5 w-5" />
        </Link>

        <button
          type="button"
          aria-label="Cambiar tema"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button
          type="button"
          aria-label="Notificaciones"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>

        <Dropdown
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                {getInitials('Carlos Mendoza')}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">Carlos Mendoza</span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">Administrador</span>
              </span>
            </button>
          }
        >
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Carlos Mendoza</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">carlos@autoequip.com</p>
          </div>
          <DropdownSeparator />
          <DropdownLabel>{settings?.appName ?? 'AutoEquip Pro'}</DropdownLabel>
          <DropdownItem to={paths.users} icon={<User className="h-4 w-4" />}>
            Mi perfil
          </DropdownItem>
          <DropdownItem to={paths.settings} icon={<Settings className="h-4 w-4" />}>
            Configuración
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem danger icon={<LogOut className="h-4 w-4" />} onClick={() => undefined}>
            Cerrar sesión
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
