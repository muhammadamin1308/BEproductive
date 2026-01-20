import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, Trophy, ClipboardCheck, Moon, Sun, LogOut, MoreVertical } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

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
        { to: '/', icon: LayoutDashboard, label: 'Today' },
        { to: '/focus', icon: Target, label: 'Focus' },
        { to: '/goals', icon: Trophy, label: 'Goals' },
    ];

    return (
        <div className="min-h-screen bg-primary-bg flex flex-col transition-colors duration-300">

            {/* Floating Header Navbar (Desktop) */}
            <header className="hidden md:flex fixed top-6 inset-x-0 justify-center z-50 pointer-events-none">
                <div className="pointer-events-auto bg-surface/80 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-lg shadow-gray-200/10 dark:shadow-black/20 rounded-full px-6 py-3 flex items-center gap-8 transition-all hover:scale-[1.01] hover:shadow-xl">

                    {/* Logo */}
                    <div className="flex items-center gap-2 pr-4 border-r border-gray-200/50 dark:border-white/10">
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
                                            : "text-secondary-text hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary-text"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                                    <span className="text-sm">{label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-4 border-l border-gray-200/50 dark:border-white/10">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-secondary-text hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary-text transition-colors"
                            title="Toggle Theme"
                            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={logout}
                            className="p-2 rounded-full text-secondary-text hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
                            title="Logout"
                            aria-label="Log out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            {/* Added top padding to account for the floating header */}
            <main className="flex-1 pb-32 md:pb-8 pt-8 md:pt-32 px-4 md:px-0">
                <Outlet />
            </main>


            {/* Mobile Bottom Navigation (visible on sm-) */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-surface/90 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-2xl px-4 py-4 z-50 flex justify-around items-center shadow-xl shadow-gray-200/20 dark:shadow-black/20">
                {/* Today */}
                <NavLink
                    to="/"
                    aria-label="Today"
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[50px]",
                        pathname === '/'
                            ? "text-cta"
                            : "text-secondary-text hover:text-primary-text"
                    )}
                >
                    <LayoutDashboard className={cn("w-6 h-6 transition-transform", pathname === '/' && "-trangray-y-1 scale-110")} strokeWidth={pathname === '/' ? 2.5 : 2} />
                    {pathname === '/' && <span className="absolute -bottom-1 w-1 h-1 bg-cta rounded-full" />}
                </NavLink>
                
                {/* Center Focus Button */}
                <NavLink
                    to="/focus"
                    aria-label="Focus"
                    className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-xl transition-colors",
                        pathname === '/focus'
                            ? "text-cta"
                            : "text-secondary-text hover:text-primary-text"
                    )}
                >
                    <Target className={cn("w-7 h-7 transition-transform", pathname === '/focus' && "-trangray-y-1 scale-110")} strokeWidth={pathname === '/focus' ? 2.5 : 2} />
                    {pathname === '/focus' && <span className="absolute -bottom-1 w-1 h-1 bg-cta rounded-full" />}
                </NavLink>
                
                {/* Goals */}
                <NavLink
                    to="/goals"
                    aria-label="Goals"
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[50px]",
                        pathname === '/goals'
                            ? "text-cta"
                            : "text-secondary-text hover:text-primary-text"
                    )}
                >
                    <Trophy className={cn("w-6 h-6 transition-transform", pathname === '/goals' && "-trangray-y-1 scale-110")} strokeWidth={pathname === '/goals' ? 2.5 : 2} />
                    {pathname === '/goals' && <span className="absolute -bottom-1 w-1 h-1 bg-cta rounded-full" />}
                </NavLink>
                
                {/* 3-dot menu button */}
                <div className="relative">
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[50px] text-secondary-text hover:text-primary-text"
                        aria-label="Open menu"
                        aria-expanded={showMobileMenu}
                    >
                        <MoreVertical className="w-6 h-6" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showMobileMenu && (
                        <>
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowMobileMenu(false)}
                            />
                            <div className="absolute bottom-full right-0 mb-2 bg-surface border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 min-w-[160px]">
                                <NavLink
                                    to="/review"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-primary-text hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    <ClipboardCheck className="w-5 h-5" />
                                    <span>Review</span>
                                </NavLink>
                                <button
                                    onClick={() => {
                                        toggleTheme();
                                        setShowMobileMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-primary-text hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        logout();
                                        setShowMobileMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
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
