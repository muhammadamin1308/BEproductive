import { RouterProvider } from 'react-router-dom';
import { AppProvider } from './providers/AppProvider';
import { router } from './routes';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
    return (
        <ErrorBoundary>
            <AppProvider>
                <RouterProvider router={router} />
                <OfflineIndicator />
            </AppProvider>
        </ErrorBoundary>
    );
}

export default App;
