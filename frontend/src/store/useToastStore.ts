import { create } from 'zustand';

interface ToastState {
  message: string | null;
  timeoutId: NodeJS.Timeout | null;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  message: null,
  timeoutId: null,
  showToast: (message) => {
    const currentTimeout = get().timeoutId;
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      set({ message: null, timeoutId: null });
    }, 3000);
    
    set({ message, timeoutId });
  },
  hideToast: () => {
    const currentTimeout = get().timeoutId;
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
    set({ message: null, timeoutId: null });
  },
}));
