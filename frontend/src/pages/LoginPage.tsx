import { GoogleLogin } from '@react-oauth/google';
import { api } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const LoginPage = () => {
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleSuccess = async (credentialResponse: any) => {
        try {
            const { credential } = credentialResponse;
            const res = await api.post('/auth/google', { credential });

            if (res.data.user) {
                login(res.data.user);
                navigate('/');
            }
        } catch (error) {
            console.error('Login failed', error);
            alert('Login failed. Please try again.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-stone-900 p-4">
            <div className="bg-white dark:bg-stone-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-stone-700 w-full max-w-md text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    Focus App
                </h1>
                <p className="text-slate-500 dark:text-stone-400 mb-8">Execute today, plan less.</p>

                {isOffline ? (
                    <div className="flex flex-col items-center gap-3 text-stone-500 dark:text-stone-400">
                        <WifiOff className="w-12 h-12" />
                        <p className="font-medium">You're offline</p>
                        <p className="text-sm">Connect to the internet to sign in</p>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleSuccess}
                            onError={() => {
                                console.log('Login Failed');
                            }}
                            useOneTap
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
