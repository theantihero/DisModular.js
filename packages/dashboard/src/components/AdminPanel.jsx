/**
 * Admin Panel Component
 * Provides access to admin functionality including user management and access requests
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the panel is open
 * @param {Function} props.onClose - Function to close the panel
 * @returns {JSX.Element} AdminPanel component
 */

import { useState } from 'react';
import _AccessRequestsPanel from './AccessRequestsPanel';
import _UserManagementPanel from './UserManagementPanel';

export function AdminPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('users');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Main Panel Container with Glassmorphic Styling */}
        <div className="macos-card flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-hologram-500/20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-3 text-2xl">🛡️</span>
                Admin Panel
              </h2>
              <button
                onClick={onClose}
                className="macos-button p-3 text-gray-400 hover:text-white transition-all duration-200"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex space-x-1 mt-4">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'users'
                    ? 'glass-strong border border-hologram-500/30 text-white'
                    : 'glass text-gray-400 hover:text-white hover:glass-strong'
                }`}
              >
                <span className="mr-2">👥</span>
                User Management
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'requests'
                    ? 'glass-strong border border-hologram-500/30 text-white'
                    : 'glass text-gray-400 hover:text-white hover:glass-strong'
                }`}
              >
                <span className="mr-2">📋</span>
                Access Requests
              </button>
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'users' ? (
              <div className="p-6">
                <UserManagementPanel />
              </div>
            ) : (
              <div className="p-6">
                <AccessRequestsPanel />
              </div>
            )}
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex-shrink-0 p-6 border-t border-hologram-500/20 glass">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400 flex items-center">
                <span className="mr-2">💡</span>
                Admin actions are logged for audit purposes
              </div>
              <button
                onClick={onClose}
                className="macos-button px-4 py-2 text-gray-400 hover:text-white transition-all duration-200"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;