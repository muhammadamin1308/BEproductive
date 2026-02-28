import { useState, useEffect } from 'react';

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 bg-surface-dark dark:bg-surface-light text-text-main-dark dark:text-text-main-light text-xs font-bold uppercase tracking-widest border border-red-500/50 shadow-lg animate-[fadeIn_0.15s_ease-out] flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-none animate-pulse" />
            Offline mode
        </div>
    );
}
