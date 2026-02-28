import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useThemeStore } from '../store/useThemeStore';
import { Header } from './Header';

export const Layout = () => {
    const { theme } = useThemeStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Ensure theme class is applied on mount/change
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex transition-colors duration-300">
            {/* Sidebar */}
            <Header
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(v => !v)}
            />

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                {/* Mobile top bar */}
                <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark sticky top-0 z-40">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-colors"
                        aria-label="Open menu"
                    >
                        <span className="material-icons align-middle">menu</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <img src="/logo-tab.svg" alt="Doable Logo" className="w-6 h-6" />
                        <span className="font-bold text-sm tracking-tight uppercase">DOABLE</span>
                    </div>
                </div>

                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
