import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface UIState {
  theme: 'light' | 'dark';
  toasts: Toast[];
  isMobileMenuOpen: boolean;
  currentModal: string | null;
  
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  toggleMobileMenu: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      toasts: [],
      isMobileMenuOpen: false,
      currentModal: null,
      
      setTheme: (theme) => set({ theme }),
      
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
      
      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            {
              ...toast,
              id: Date.now().toString(),
              duration: toast.duration || 5000,
            },
          ],
        })),
      
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),
      
      clearToasts: () => set({ toasts: [] }),
      
      setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
      
      toggleMobileMenu: () =>
        set((state) => ({
          isMobileMenuOpen: !state.isMobileMenuOpen,
        })),
      
      openModal: (currentModal) => set({ currentModal }),
      
      closeModal: () => set({ currentModal: null }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);
