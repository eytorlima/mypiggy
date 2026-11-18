import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function PrivateRoute({ children}) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className='flex items-center justify-center min-h-dvh'>
                <p role="status" className='text-gray-500'>Carregando...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}