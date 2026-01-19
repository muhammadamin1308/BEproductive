import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/axios';

import { FocusTimerManager } from '../components/FocusTimerManager';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const login = useAuthStore((state) => state.login);
    const logout = useAuthStore((state) => state.logout);
    const setLoading = useAuthStore((state) => state.setLoading);
    const hasHydrated = useAuthStore((state) => state._hasHydrated);

    useEffect(() => {
        // Wait for hydration before checking auth
        if (!hasHydrated) return;

        const checkAuth = async () => {
            // If offline, use cached auth state from localStorage
            if (!navigator.onLine) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/auth/me');
                if (res.data.user) {
                    login(res.data.user);
                }
            } catch (error) {
                // Only logout if we're online and the request failed (invalid session)
                if (navigator.onLine) {
                    logout();
                } else {
                    setLoading(false);
                }
            }
        };
        checkAuth();
    }, [login, logout, setLoading, hasHydrated]);

    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
            <QueryClientProvider client={queryClient}>
                <FocusTimerManager />
                {children}
            </QueryClientProvider>
        </GoogleOAuthProvider>
    );
};
