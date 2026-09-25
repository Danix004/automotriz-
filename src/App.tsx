import { Component, type ErrorInfo, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@/routes';
import { useUIStore } from '@/store/uiStore';
import { getErrorMessage } from '@/utils/errors';

/* --------------------------- query client --------------------------- */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/* ------------------------- error boundary --------------------------- */

interface BoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error de render:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
          <div className="max-w-md space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-2xl">⚠️</div>
            <h1 className="text-lg font-semibold text-white">Algo salió mal al renderizar</h1>
            <p className="text-sm text-slate-400">{getErrorMessage(this.state.error)}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null });
                window.location.assign('/dashboard');
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Reiniciar aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ------------------------------- app -------------------------------- */

function applyInitialTheme() {
  const stored = window.localStorage.getItem('autoequip.ui');
  const theme = stored ? (JSON.parse(stored) as { state?: { theme?: string } }).state?.theme : 'dark';
  const root = document.documentElement;
  const dark = theme !== 'light';
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}

applyInitialTheme();
// Sincroniza el tema persistido por Zustand cuando cambia en otra pestaña.
useUIStore.subscribe((state) => {
  const root = document.documentElement;
  root.classList.toggle('dark', state.theme === 'dark');
  root.style.colorScheme = state.theme;
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
