import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export const Header = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) => {
    const { pathname } = useLocation();
    const logout = useAuthStore(state => state.logout);
    const { theme, toggleTheme } = useThemeStore();

    useEffect(() => {
        onClose?.();
    }, [pathname]);

    const navItems = [
        { to: '/dashboard', icon: 'dashboard', label: 'TODAY' },
        { to: '/focus', icon: 'timer', label: 'FOCUS' },
        { to: '/deadlines', icon: 'event_note', label: 'DEADLINES' },
        { to: '/goals', icon: 'track_changes', label: 'GOALS' },
        { to: '/review', icon: 'rate_review', label: 'REVIEW' },
    ];

    const buildSidebar = (collapsed: boolean) => (
        <aside
            className={`flex flex-col h-screen bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark transition-all duration-200 ${
                collapsed ? 'w-14' : 'w-56'
            }`}
        >
            {/* Logo + collapse toggle */}
            <div
                className={`flex items-center border-b border-border-light dark:border-border-dark shrink-0 h-[60px] ${
                    collapsed ? 'justify-center px-0' : 'gap-2 px-4'
                }`}
            >
                {collapsed ? (
                    <button
                        onClick={onToggleCollapse}
                        className="flex items-center justify-center w-full h-full text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                        title="Expand sidebar"
                    >
                        <img src="/logo-tab.svg" alt="Doable Logo" className="w-6 h-6" />
                    </button>
                ) : (
                    <>
                        <img src="/logo-tab.svg" alt="Doable Logo" className="w-7 h-7 shrink-0" />
                        <span className="font-bold text-base tracking-tight uppercase flex-1">DOABLE</span>
                        <button
                            onClick={onToggleCollapse}
                            className="text-text-muted-light dark:text-text-muted-dark hover:text-primary transition-colors"
                            title="Collapse sidebar"
                        >
                            <span className="material-icons text-[18px]">chevron_left</span>
                        </button>
                    </>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2 overflow-y-auto">
                {navItems.map(({ to, icon, label }) => {
                    const isActive = pathname === to;
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            title={collapsed ? label : undefined}
                            className={`flex items-center rounded transition-colors ${
                                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
                            } text-[11px] font-bold tracking-widest ${
                                isActive
                                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                                    : 'text-text-muted-light dark:text-text-muted-dark hover:bg-background-light dark:hover:bg-background-dark hover:text-text-main-light dark:hover:text-text-main-dark'
                            }`}
                        >
                            <span className="material-icons text-[18px] shrink-0">{icon}</span>
                            {!collapsed && label}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom actions */}
            <div className="border-t border-border-light dark:border-border-dark p-2 flex flex-col gap-0.5 shrink-0">
                <button
                    onClick={toggleTheme}
                    title={collapsed ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : undefined}
                    className={`flex items-center rounded text-[11px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark hover:bg-background-light dark:hover:bg-background-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-colors w-full py-2.5 ${
                        collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                    }`}
                >
                    <span className="material-icons text-[18px] shrink-0">
                        {theme === 'light' ? 'dark_mode' : 'light_mode'}
                    </span>
                    {!collapsed && (theme === 'light' ? 'Dark Mode' : 'Light Mode')}
                </button>
                <button
                    onClick={logout}
                    title={collapsed ? 'Logout' : undefined}
                    className={`flex items-center rounded text-[11px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark hover:bg-background-light dark:hover:bg-background-dark hover:text-red-500 transition-colors w-full py-2.5 ${
                        collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                    }`}
                >
                    <span className="material-icons text-[18px] shrink-0">logout</span>
                    {!collapsed && 'Logout'}
                </button>
            </div>
        </aside>
    );

    return (
        <>
            {/* Desktop: persistent sidebar, collapsible */}
            <div className="hidden md:flex h-screen sticky top-0 shrink-0">
                {buildSidebar(isCollapsed)}
            </div>

            {/* Mobile: slide-in overlay (always expanded) */}
            {isOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/50" onClick={onClose} />
                    <div className="relative z-10 flex h-full">
                        {buildSidebar(false)}
                    </div>
                </div>
            )}
        </>
    );
};
