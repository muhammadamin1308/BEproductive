import { createBrowserRouter } from 'react-router-dom';
import { FocusPage } from './pages/FocusPage';
import { GoalsPage } from './pages/GoalsPage';
import { ReviewPage } from './pages/ReviewPage';
import { TodayPage } from './pages/TodayPage';
import { LoginPage } from './pages/LoginPage';
import { DeadlinesPage } from './pages/DeadlinesPage';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';

export const router = createBrowserRouter([
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <Layout />,
                children: [
                    {
                        path: '/dashboard',
                        element: <TodayPage />,
                    },
                    {
                        path: '/focus',
                        element: <FocusPage />,
                    },
                    {
                        path: '/goals',
                        element: <GoalsPage />,
                    },
                    {
                        path: '/deadlines',
                        element: <DeadlinesPage />,
                    },
                    {
                        path: '/review',
                        element: <ReviewPage />,
                    },
                ],
            },
            {
                path: '/',
                element: <HomePage />,
            },
        ],
    },
    {
        path: '/login',
        element: <LoginPage />,
    },
]);
