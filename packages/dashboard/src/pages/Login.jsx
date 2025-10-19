/**
 * Login Page
 * Modern Discord OAuth login interface
 * @author fkndean_
 * @date 2025-10-14
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../viewmodels/AppViewModel';
import { useTheme } from '../hooks/useTheme';
import CryptoSupport from '../components/CryptoSupport';
import { SpaceBackground } from '../components/SpaceBackground';

export function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, checkAuth } = useAppStore();
  const { theme, toggleTheme } = useTheme();
  const [showCryptoSupport, setShowCryptoSupport] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleDiscordLogin = () => {
    const discordAuthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/auth/discord`;
    window.location.href = discordAuthUrl;
  };

  const getBackgroundClass = () => {
    switch (theme) {
      case 'space':
        return 'min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden';
      case 'light':
        return 'min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center p-4';
      default:
        return 'min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4';
    }
  };

  return (
    <div className={getBackgroundClass()}>
      {/* Space Background */}
      {theme === 'space' && <SpaceBackground />}
      
      {/* Theme Toggle and Support Button */}
      <div className="absolute top-4 right-4 flex space-x-3 z-10">
        {/* Support Button */}
        <button
          onClick={() => setShowCryptoSupport(true)}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all hover:scale-105 ${
            theme === 'space'
              ? 'macos-button bg-gradient-to-r from-energy-green/20 to-hologram-500/20 hover:from-energy-green/30 hover:to-hologram-500/30'
              : 'bg-gray-800/80 backdrop-blur-lg border border-gray-700/50 hover:bg-gray-700/80'
          }`}
          title="Support the project with crypto donations"
        >
          <span className="text-energy-green">💎</span>
          <span className="text-energy-green text-sm font-medium">Support</span>
        </button>

        {/* Discord Invite Button */}
        <a
          href="https://discord.gg/exqNpFWjJP"
          target="_blank"
          rel="noopener noreferrer"
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all hover:scale-105 ${
            theme === 'space'
              ? 'holographic-glow bg-gradient-to-r from-hologram-500 to-nebula-purple'
              : 'bg-gray-800/80 backdrop-blur-lg border border-gray-700/50'
          }`}
          title="Join our Discord server"
        >
          <span className="text-white text-lg">🚀</span>
        </a>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Background Elements */}
        {theme === 'space' && (
          <>
            <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-500/20 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-500/20 rounded-full blur-lg"></div>
          </>
        )}

        {/* Main Login Card */}
        <div className={`relative rounded-3xl shadow-2xl backdrop-blur-xl border border-white/10 ${
          theme === 'space'
            ? 'bg-white/5'
            : theme === 'light'
            ? 'bg-white/80 backdrop-blur-lg border border-gray-200/50'
            : 'bg-gray-800/80 backdrop-blur-lg border border-gray-700/50'
        }`}>
          {/* Logo and Header */}
          <div className="text-center p-8 pb-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
              theme === 'space'
                ? 'bg-white/10 backdrop-blur-sm border border-white/20'
                : theme === 'light'
                ? 'bg-gray-100/80 backdrop-blur-sm border border-gray-200/50'
                : 'bg-gray-700/80 backdrop-blur-sm border border-gray-600/50'
            }`}>
              <img 
                src="/assets/dismodularjs.png" 
                alt="DisModular.js Logo" 
                className="w-12 h-12 object-contain filter brightness-110"
              />
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${
              theme === 'space' ? 'text-white' : theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Discord Bot Admin
            </h1>
            <p className={`text-sm ${
              theme === 'space' ? 'text-gray-300' : theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Modular Plugin Management System
            </p>
          </div>

          {/* Features List */}
          <div className="px-8 mb-8">
            <h3 className={`font-medium mb-4 text-center ${
              theme === 'space' ? 'text-white' : theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              ✨ Features
            </h3>
            <div className="space-y-3">
              <div className={`flex items-center space-x-3 ${
                theme === 'space' ? 'text-gray-300' : theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                <span className="text-green-400">✅</span>
                <span className="text-sm">Visual Plugin Editor</span>
              </div>
              <div className={`flex items-center space-x-3 ${
                theme === 'space' ? 'text-gray-300' : theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                <span className="text-green-400">✅</span>
                <span className="text-sm">Real-time Bot Monitoring</span>
              </div>
              <div className={`flex items-center space-x-3 ${
                theme === 'space' ? 'text-gray-300' : theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                <span className="text-green-400">✅</span>
                <span className="text-sm">Advanced Node Palette</span>
              </div>
              <div className={`flex items-center space-x-3 ${
                theme === 'space' ? 'text-gray-300' : theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                <span className="text-green-400">✅</span>
                <span className="text-sm">Admin Management</span>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <div className="px-8 mb-6">
            <button
              onClick={handleDiscordLogin}
              className={`w-full font-semibold py-4 px-6 rounded-2xl transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-3 ${
                theme === 'space'
                  ? 'bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white'
                  : theme === 'light'
                  ? 'bg-gray-900 hover:bg-gray-800 text-white border border-gray-300'
                  : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
              }`}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Continue with Discord</span>
            </button>
          </div>

          {/* Security Notice */}
          <div className={`mx-8 mb-8 p-4 rounded-2xl ${
            theme === 'space'
              ? 'bg-white/5 backdrop-blur-sm border border-white/10'
              : theme === 'light'
              ? 'bg-gray-100/80 backdrop-blur-sm border border-gray-200/50'
              : 'bg-gray-700/50 backdrop-blur-sm border border-gray-600/50'
          }`}>
            <div className="flex items-start space-x-3">
              <span className="text-blue-400 text-lg">🔒</span>
              <div>
                <h4 className={`font-medium text-sm ${
                  theme === 'space' ? 'text-blue-300' : theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                }`}>
                  Secure Authentication
                </h4>
                <p className={`text-xs mt-1 ${
                  theme === 'space' ? 'text-gray-300' : theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  Only authorized administrators can access this dashboard. Your Discord account is used for secure authentication.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className={`text-xs ${
            theme === 'space' ? 'text-gray-400' : theme === 'light' ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Powered by Discord Bot Modular Platform v0.0.1
          </p>
          <p className={`text-xs mt-1 ${
            theme === 'space' ? 'text-gray-500' : theme === 'light' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Made with ❤️ by fkndean_
          </p>
        </div>
      </div>

      {/* Crypto Support Modal */}
      <CryptoSupport 
        isOpen={showCryptoSupport} 
        onClose={() => setShowCryptoSupport(false)} 
      />
    </div>
  );
}

export default Login;