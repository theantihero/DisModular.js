/**
 * Login Page
 * Modern Discord OAuth login interface
 * @author fkndean_
 * @date 2025-10-14
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../viewmodels/AppViewModel';

export function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, checkAuth } = useAppStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleDiscordLogin = () => {
    const discordAuthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/auth/discord`;
    window.location.href = discordAuthUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main Login Card */}
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700/50 p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white text-3xl">🤖</span>
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">Discord Bot Admin</h1>
            <p className="text-gray-400 text-sm">Modular Plugin Management System</p>
          </div>

          {/* Features List */}
          <div className="mb-8">
            <h3 className="text-white font-medium mb-4 text-center">✨ Features</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-green-400">✅</span>
                <span className="text-sm">Visual Plugin Editor</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-green-400">✅</span>
                <span className="text-sm">Real-time Bot Monitoring</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-green-400">✅</span>
                <span className="text-sm">Advanced Node Palette</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-green-400">✅</span>
                <span className="text-sm">Admin Management</span>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleDiscordLogin}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>Continue with Discord</span>
          </button>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <span className="text-blue-400 text-lg">🔒</span>
              <div>
                <h4 className="text-blue-400 font-medium text-sm">Secure Authentication</h4>
                <p className="text-gray-400 text-xs mt-1">
                  Only authorized administrators can access this dashboard. Your Discord account is used for secure authentication.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            Powered by Discord Bot Modular Platform v0.0.1
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Made with ❤️ by fkndean_
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;