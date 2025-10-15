/**
 * Auth Callback Page
 * Handles Discord OAuth callback and redirects to dashboard
 * @author fkndean_
 * @date 2025-10-14
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../viewmodels/AppViewModel';

/**
 * AuthCallback Component
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const { checkAuth } = useAppStore();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    // Wait a moment for the session to be established
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if authenticated
    const isAuth = await checkAuth();
    
    if (isAuth) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing authentication...</p>
      </div>
    </div>
  );
}

export default AuthCallback;

