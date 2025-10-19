/**
 * Mobile Navigation Component
 * Responsive navigation for mobile devices
 * @author fkndean_
 * @date 2025-10-14
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../viewmodels/AppViewModel';
import { useTheme } from '../hooks/useTheme';
import { getBotInviteUrl } from '../utils/discordInvite';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAppStore();
  const { theme } = useTheme();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/plugins/new', label: 'New Plugin', icon: '➕' },
    { path: '/plugins', label: 'All Plugins', icon: '🔌' }
  ];

  const isActive = (path) => location.pathname === path;

  const handleNavClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`md:hidden fixed top-4 left-4 z-50 p-3 rounded-lg shadow-lg ${
          theme === 'space'
            ? 'glass-strong border border-hologram-500/30 holographic-glow'
            : 'bg-gray-800/80 backdrop-blur-lg border border-gray-700/50'
        }`}
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
          <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
          <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></div>
          <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
        </div>
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed left-0 top-0 h-full w-80 border-r z-40 transform transition-transform duration-300 ${
        theme === 'space'
          ? 'glass-strong border-hologram-500/30'
          : 'bg-gray-800/95 backdrop-blur-lg border-gray-700/50'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-8">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              theme === 'space'
                ? 'bg-gradient-to-r from-hologram-500 to-nebula-purple holographic-glow'
                : 'bg-gradient-to-r from-blue-500 to-purple-600'
            }`}>
              <img 
                src="/assets/dismodularjs.png" 
                alt="DisModular.js Logo" 
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <h1 className="text-white text-lg font-bold">Discord Bot</h1>
              <p className="text-gray-400 text-xs">Admin Panel</p>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <img 
                src={user?.data?.avatar ? `https://cdn.discordapp.com/avatars/${user.data.discord_id}/${user.data.avatar}.png` : '/default-avatar.png'} 
                alt={user?.data?.username || 'User'} 
                className="w-12 h-12 rounded-full"
                onError={(e) => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiM2MzY2RjEiLz4KPHN2Zz4K'; }}
              />
              <div>
                <p className="text-white font-medium">{user?.data?.username || 'Loading...'}</p>
                <p className="text-gray-400 text-sm">👑 Administrator</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Divider */}
          <div className="border-t border-gray-700 my-6"></div>

          {/* Admin Section */}
          <div className="space-y-2">
            <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider px-4 mb-2">
              Admin Tools
            </h3>
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors">
              <span className="text-xl">👥</span>
              <span className="font-medium">Manage Users</span>
            </button>
          </div>

          {/* Bot Invite Section */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider px-4 mb-2">
              Bot Management
            </h3>
            <a
              href={getBotInviteUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-green-400 hover:bg-green-600/20 hover:text-green-300 transition-colors"
            >
              <span className="text-xl">➕</span>
              <span className="font-medium">Invite Bot to Server</span>
            </a>
          </div>

          {/* Logout Button */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileNav;
