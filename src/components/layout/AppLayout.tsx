import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/Feedback';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

/** Shell de la aplicación: sidebar + header + área de contenido. */
export function AppLayout() {
  const mobileOpen = useUIStore((state) => state.mobileSidebarOpen);
  const setMobileOpen = useUIStore((state) => state.setMobileSidebar);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, setMobileOpen]);

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-background">
      {/* Sidebar desktop */}
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <Sidebar variant="desktop" />
      </div>

      {/* Sidebar móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-slide-up">
            <Sidebar variant="mobile" onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className={cn('flex min-w-0 flex-1 flex-col')}>
        <Header onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800 px-4 py-4 text-center text-xs text-slate-400 sm:px-6">
          © {new Date().getFullYear()} AutoEquip Pro · Sistema de equipamientos y accesorios para automóviles
        </footer>
      </div>

      <Toaster />
    </div>
  );
}
