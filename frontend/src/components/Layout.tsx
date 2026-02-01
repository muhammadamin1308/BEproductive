import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { Header } from './Header';
import { Footer } from './Footer';

export const Layout = () => {
    const { pathname } = useLocation();
    const logout = useAuthStore(state => state.logout);
    const { theme, toggleTheme } = useThemeStore();
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Ensure theme class is applied on mount/change
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const navItems = [
        { to: '/dashboard', icon: 'dashboard', label: 'Today' },
        { to: '/focus', icon: 'timer', label: 'Focus' },
        { to: '/goals', icon: 'track_changes', label: 'Goals' },
    ];

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col transition-colors duration-300">
            {/* Desktop Header */}
            <div className="hidden md:block">
                <Header />
            </div>

            {/* Mobile Header (simplified) */}
            <header className="md:hidden border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-4 py-3 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <span className="material-icons text-primary text-lg">terminal</span>
                    <span className="font-bold text-sm tracking-tight uppercase">
                        BEPRODUCTIVE
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-text-muted-light dark:text-text-muted-dark"
                    >
                        <span className="material-icons text-lg">
                            {theme === 'light' ? 'dark_mode' : 'light_mode'}
                        </span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 pb-24 md:pb-8">
                <Outlet />
            </main>

            {/* Desktop Footer */}
            <div className="hidden md:block">
                <Footer />
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark px-2 py-2 z-50 flex justify-around items-center">
                {navItems.map(({ to, icon, label }) => {
                    const isActive = pathname === to;
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            className={`flex flex-col items-center gap-1 px-4 py-2 rounded transition-colors ${isActive
                                ? 'text-primary'
                                : 'text-text-muted-light dark:text-text-muted-dark'
                                }`}
                        >
                            <span className="material-icons text-xl">{icon}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wide">
                                {label}
                            </span>
                        </NavLink>
                    );
                })}

                {/* More Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="flex flex-col items-center gap-1 px-4 py-2 rounded text-text-muted-light dark:text-text-muted-dark"
                    >
                        <span className="material-icons text-xl">more_vert</span>
                        <span className="text-[10px] uppercase font-bold tracking-wide">More</span>
                    </button>

                    {/* Dropdown Menu */}
                    {showMobileMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowMobileMenu(false)}
                            />
                            <div className="absolute bottom-full right-0 mb-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-lg overflow-hidden z-50 min-w-[160px]">
                                <NavLink
                                    to="/review"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors text-sm"
                                >
                                    <span className="material-icons text-lg">rate_review</span>
                                    <span>Review</span>
                                </NavLink>
                                <button
                                    onClick={() => {
                                        logout();
                                        setShowMobileMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                                >
                                    <span className="material-icons text-lg">logout</span>
                                    <span>Logout</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </nav>
        </div>
    );
};
