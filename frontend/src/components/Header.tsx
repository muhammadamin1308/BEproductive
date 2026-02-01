import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

export const Header = () => {
    const { pathname } = useLocation();
    const logout = useAuthStore(state => state.logout);
    const { theme, toggleTheme } = useThemeStore();

    const navItems = [
        { to: '/', icon: 'dashboard', label: 'TODAY' },
        { to: '/focus', icon: 'timer', label: 'FOCUS' },
        { to: '/review', icon: 'rate_review', label: 'REVIEW' },
        { to: '/goals', icon: 'track_changes', label: 'GOALS' },
    ];

    return (
        <header className="border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-6 py-3 flex justify-between items-center sticky top-0 z-10">
            {/* Logo */}
            <div className="flex items-center gap-3">
                <span className="material-icons text-primary text-xl">terminal</span>
                <span className="font-bold text-lg tracking-tight uppercase">
                    BEPRODUCTIVE{' '}
                    <span className="text-text-muted-light dark:text-text-muted-dark text-xs ml-1">
                        V2.5.0
                    </span>
                </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8 text-sm">
                {navItems.map(({ to, icon, label }) => {
                    const isActive = pathname === to;
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            className={`flex items-center gap-2 transition-colors ${isActive
                                    ? 'font-bold text-primary border-b-2 border-primary pb-0.5'
                                    : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark'
                                }`}
                        >
                            <span className="material-icons text-base">{icon}</span>
                            {label}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* System Status */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-xs">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-text-muted-light dark:text-text-muted-dark">SYS_ONLINE</span>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-colors"
                    title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                    <span className="material-icons">
                        {theme === 'light' ? 'dark_mode' : 'light_mode'}
                    </span>
                </button>

                {/* Settings */}
                <button className="text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-colors">
                    <span className="material-icons">settings</span>
                </button>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-colors"
                    title="Logout"
                >
                    <span className="material-icons">logout</span>
                </button>
            </div>
        </header>
    );
};
