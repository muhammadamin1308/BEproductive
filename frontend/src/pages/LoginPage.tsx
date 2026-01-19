import { GoogleLogin } from '@react-oauth/google';
import { api } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

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
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 w-full max-w-md text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    Focus App
                </h1>
                <p className="text-slate-500 mb-8">Execute today, plan less.</p>

                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => {
                            console.log('Login Failed');
                        }}
                        useOneTap
                    />
                </div>
            </div>
        </div>
    );
};
