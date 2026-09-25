/** Estado global de UI: tema, sidebar y panel de búsqueda. */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

interface UIState {
  theme: ThemeMode;
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  commandPaletteOpen: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setMobileSidebar: (open: boolean) => void;
  setCommandPalette: (open: boolean) => void;
}

function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarOpen: true,
      mobileSidebarOpen: false,
      commandPaletteOpen: false,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      setMobileSidebar: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
      setCommandPalette: (commandPaletteOpen) => set({ commandPaletteOpen }),
    }),
    {
      name: 'autoequip.ui',
      partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);
