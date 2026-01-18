import { createBrowserRouter } from 'react-router-dom';
import { FocusPage } from './pages/FocusPage';
import { GoalsPage } from './pages/GoalsPage';
import { CalendarPage } from './pages/CalendarPage';
import { ReviewPage } from './pages/ReviewPage';
import { TodayPage } from './pages/TodayPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Layout } from './components/Layout';

export const router = createBrowserRouter([
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <Layout />,
                children: [
                    {
                        path: '/',
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
                        path: '/calendar',
                        element: <CalendarPage />,
                    },
                    {
                        path: '/review',
                        element: <ReviewPage />,
                    },
                ],
            },
        ],
    },
    {
        path: '/login',
        element: <LoginPage />,
    },
]);
