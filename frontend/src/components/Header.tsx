import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

export const Header = () => {
    const { pathname } = useLocation();
    const logout = useAuthStore(state => state.logout);
    const { theme, toggleTheme } = useThemeStore();
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navItems = [
        { to: '/dashboard', icon: 'dashboard', label: 'TODAY' },
        { to: '/focus', icon: 'timer', label: 'FOCUS' },
        { to: '/deadlines', icon: 'event_note', label: 'DEADLINES' },
        { to: '/review', icon: 'rate_review', label: 'REVIEW' },
        { to: '/goals', icon: 'track_changes', label: 'GOALS' },
    ];

    return (
        <header className="border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-6 py-3 flex justify-between items-center sticky top-0 z-10">
            {/* Logo */}
            <div className="flex items-center gap-1">
                <img src="/logo-tab.svg" alt="Doable Logo" className="w-8 h-8" />
                <span className="font-bold text-lg tracking-tight uppercase">
                    DOABLE{' '}
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
                {/* Settings */}
                <div className="relative" ref={settingsRef}>
                    <button
                        onClick={() => setShowSettings((v) => !v)}
                        className="text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-colors"
                        title="Settings"
                    >
                        <span className="material-icons">settings</span>
                    </button>
                    {showSettings && (
                        <div className="absolute right-0 top-10 z-50 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-xl min-w-[180px]">
                            <button
                                onClick={() => { toggleTheme(); setShowSettings(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark hover:text-primary transition-colors"
                            >
                                <span className="material-icons text-base">
                                    {theme === 'light' ? 'dark_mode' : 'light_mode'}
                                </span>
                                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                            </button>
                            <div className="border-t border-border-light dark:border-border-dark" />
                            <button
                                onClick={() => { logout(); setShowSettings(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark hover:text-red-500 transition-colors"
                            >
                                <span className="material-icons text-base">logout</span>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
