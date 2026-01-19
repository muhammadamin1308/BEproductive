import { RouterProvider } from 'react-router-dom';
import { AppProvider } from './providers/AppProvider';
import { router } from './routes';
import { OfflineIndicator } from './components/OfflineIndicator';

function App() {
    return (
        <AppProvider>
            <RouterProvider router={router} />
            <OfflineIndicator />
        </AppProvider>
    );
}

export default App;
