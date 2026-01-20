import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const ProtectedRoute = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isLoading = useAuthStore((state) => state.isLoading);
    const hasHydrated = useAuthStore((state) => state._hasHydrated);

    // Wait for hydration from localStorage before making auth decisions
    if (!hasHydrated || isLoading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
