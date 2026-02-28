import { useToastStore } from '../store/useToastStore';

export function GlobalToast() {
  const message = useToastStore((state) => state.message);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 bg-surface-dark dark:bg-surface-light text-text-main-dark dark:text-text-main-light text-xs font-bold uppercase tracking-widest border border-primary/30 shadow-lg animate-[fadeIn_0.15s_ease-out]">
      <span className="text-primary mr-2">{'>'}</span>{message}
    </div>
  );
}
