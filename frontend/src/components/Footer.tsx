export const Footer = () => {
    return (
        <footer className="border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-6 py-2 text-[10px] uppercase text-text-muted-light dark:text-text-muted-dark flex justify-between items-center sticky bottom-0 z-10">
            <div className="flex gap-6">
                <span>© 2026 BeProductive Command_Center</span>
                <span className="hidden md:inline">SYS_LAT: 14ms</span>
                <span className="hidden md:inline">MEM: 42%</span>
            </div>
            <div className="flex gap-4">
                <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    LOGS: ACTIVE
                </span>
            </div>
        </footer>
    );
};
