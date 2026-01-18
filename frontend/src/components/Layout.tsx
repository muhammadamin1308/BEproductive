import { useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, Trophy, Calendar, ClipboardCheck, Moon, Sun, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

export const Layout = () => {
    const { pathname } = useLocation();
    const logout = useAuthStore(state => state.logout);
    const { theme, toggleTheme } = useThemeStore();

    // Ensure theme class is applied on mount/change
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Today' },
        { to: '/focus', icon: Target, label: 'Focus' },
        { to: '/goals', icon: Trophy, label: 'Goals' },
        { to: '/calendar', icon: Calendar, label: 'Calendar' },
        { to: '/review', icon: ClipboardCheck, label: 'Review' },
    ];

    return (
        <div className="min-h-screen bg-primary-bg flex flex-col transition-colors duration-300">

            {/* Floating Header Navbar (Desktop) */}
            <header className="hidden md:flex fixed top-6 inset-x-0 justify-center z-50 pointer-events-none">
                <div className="pointer-events-auto bg-surface/80 backdrop-blur-md border border-slate-200/50 dark:border-white/10 shadow-lg shadow-slate-200/10 dark:shadow-black/20 rounded-full px-6 py-3 flex items-center gap-8 transition-all hover:scale-[1.01] hover:shadow-xl">

                    {/* Logo */}
                    <div className="flex items-center gap-2 pr-4 border-r border-slate-200/50 dark:border-white/10">
                        <img src="/logo.svg" alt="Logo" className="w-32 object-contain" />
                    </div>

                    {/* Nav Items */}
                    <nav className="flex items-center gap-1">
                        {navItems.map(({ to, icon: Icon, label }) => {
                            const isActive = pathname === to;
                            return (
                                <NavLink
                                    key={to}
                                    to={to}
                                    className={cn(
                                        "relative px-4 py-2 rounded-full flex items-center gap-2 transition-all",
                                        isActive
                                            ? "bg-cta  text-surface font-medium shadow-md"
                                            : "text-secondary-text hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary-text"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                                    <span className="text-sm">{label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-4 border-l border-slate-200/50 dark:border-white/10">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-secondary-text hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary-text transition-colors"
                            title="Toggle Theme"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={logout}
                            className="p-2 rounded-full text-secondary-text hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            {/* Added top padding to account for the floating header */}
            <main className="flex-1 pb-32 md:pb-8 pt-32 px-4 md:px-0">
                <Outlet />
            </main>


            {/* Mobile Bottom Navigation (visible on sm-) */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-surface/90 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-2xl px-6 py-4 z-50 flex justify-between items-center shadow-xl shadow-slate-200/20 dark:shadow-black/20">
                {navItems.map(({ to, icon: Icon, label }) => {
                    const isActive = pathname === to;
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[50px]",
                                isActive
                                    ? "text-cta"
                                    : "text-secondary-text hover:text-primary-text"
                            )}
                        >
                            <Icon className={cn("w-6 h-6 transition-transform", isActive && "-translate-y-1 scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                            {isActive && <span className="absolute -bottom-1 w-1 h-1 bg-cta rounded-full" />}
                        </NavLink>
                    );
                })}
                {/* Mobile Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[50px] text-secondary-text"
                >
                    {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                </button>
            </nav>
        </div>
    );
};
