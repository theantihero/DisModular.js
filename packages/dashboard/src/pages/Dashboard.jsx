/**
 * Dashboard Page
 * Modern admin dashboard with bot status, plugins, and management
 * @author fkndean_
 * @date 2025-10-14
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePluginStore } from '../viewmodels/PluginViewModel';
import { useAppStore } from '../viewmodels/AppViewModel';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import AdminPanel from '../components/AdminPanel';

/**
 * Dashboard Component
 */
export function Dashboard() {
  const navigate = useNavigate();
  const { plugins, fetchPlugins, deletePlugin, updatePlugin } = usePluginStore();
  const { botStatus, fetchBotStatus, user, logout } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [togglingPlugins, setTogglingPlugins] = useState(new Set());
  const [deletingPlugins, setDeletingPlugins] = useState(new Set());
  const [showAdminTools, setShowAdminTools] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPlugins(), fetchBotStatus()]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlugin = async (plugin) => {
    if (togglingPlugins.has(plugin.id)) return;
    
    setTogglingPlugins(prev => new Set(prev).add(plugin.id));
    try {
      await updatePlugin(plugin.id, { enabled: !plugin.enabled });
      toast.success(`${plugin.enabled ? '🔴' : '🟢'} Plugin ${plugin.enabled ? 'disabled' : 'enabled'} successfully`);
    } catch (error) {
      toast.error(`❌ Failed to toggle plugin: ${error.error || error.message}`);
    } finally {
      setTogglingPlugins(prev => {
        const newSet = new Set(prev);
        newSet.delete(plugin.id);
        return newSet;
      });
    }
  };

  const handleDeletePlugin = async (plugin) => {
    if (!confirm(`🗑️ Are you sure you want to delete "${plugin.name}"?`)) {
      return;
    }

    if (deletingPlugins.has(plugin.id)) return;

    setDeletingPlugins(prev => new Set(prev).add(plugin.id));
    try {
      await deletePlugin(plugin.id);
      toast.success(`✅ Plugin "${plugin.name}" deleted successfully`);
    } catch (error) {
      toast.error(`❌ Failed to delete plugin: ${error.error || error.message}`);
      setDeletingPlugins(prev => {
        const newSet = new Set(prev);
        newSet.delete(plugin.id);
        return newSet;
      });
    }
  };

  const getPluginIcon = (type) => {
    switch (type) {
      case 'slash': return '⚡';
      case 'message': return '💬';
      case 'both': return '🔄';
      default: return '🔌';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'connecting': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      case 'connecting': return '🟡';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white text-xl font-medium">🚀 Loading dashboard...</p>
          <p className="text-gray-400 text-sm mt-2">Initializing admin panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Modern Header */}
      <header className="bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div>
                  <h1 className="text-white text-xl font-bold">Discord Bot Admin</h1>
                  <p className="text-gray-400 text-xs">Modular Plugin System</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Bot Status */}
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700/50 rounded-lg">
                <span className={getStatusIcon(botStatus?.status)}></span>
                <span className={`text-sm font-medium ${getStatusColor(botStatus?.status)}`}>
                  {botStatus?.status || 'Unknown'}
                </span>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAdminTools(!showAdminTools)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors"
                >
                  <span className="text-blue-400">👑</span>
                  <span className="text-blue-400 text-sm font-medium">Admin</span>
                </button>

                <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700/50 rounded-lg">
                  <img 
                    src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png` : '/default-avatar.png'} 
                    alt={user?.username} 
                    className="w-6 h-6 rounded-full"
                    onError={(e) => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiM2MzY2RjEiLz4KPHN2Zz4K'; }}
                  />
                  <span className="text-white text-sm font-medium">{user?.username}</span>
                </div>

                <button
                  onClick={logout}
                  className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Tools */}
      {showAdminTools && (
        <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2 flex items-center">
                  <span className="mr-2">👥</span> User Management
                </h3>
                <p className="text-gray-400 text-sm mb-3">Manage admin users and permissions</p>
                <button 
                  onClick={() => setShowAdminModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  Manage Admins
                </button>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2 flex items-center">
                  <span className="mr-2">📊</span> Analytics
                </h3>
                <p className="text-gray-400 text-sm mb-3">View bot usage and performance metrics</p>
                <button 
                  onClick={() => navigate('/analytics')}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                >
                  View Analytics
                </button>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2 flex items-center">
                  <span className="mr-2">⚙️</span> System Settings
                </h3>
                <p className="text-gray-400 text-sm mb-3">Configure bot settings and preferences</p>
                <button 
                  onClick={() => navigate('/settings')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                >
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Plugins</p>
                <p className="text-white text-2xl font-bold">{plugins.length}</p>
              </div>
              <span className="text-3xl">🔌</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Plugins</p>
                <p className="text-white text-2xl font-bold">{plugins.filter(p => p.enabled).length}</p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Slash Commands</p>
                <p className="text-white text-2xl font-bold">{plugins.filter(p => p.type === 'slash' || p.type === 'both').length}</p>
              </div>
              <span className="text-3xl">⚡</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Bot Status</p>
                <p className="text-white text-lg font-bold capitalize">{botStatus?.status || 'Unknown'}</p>
              </div>
              <span className="text-3xl">{getStatusIcon(botStatus?.status)}</span>
            </div>
          </div>
        </div>

        {/* Plugins Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl">
          <div className="p-6 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-xl font-bold flex items-center">
                  <span className="mr-2">🔌</span> Plugin Management
                </h2>
                <p className="text-gray-400 text-sm mt-1">Manage your Discord bot plugins</p>
              </div>
              <button
                onClick={() => navigate('/plugins/new')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
              >
                ➕ Create Plugin
              </button>
            </div>
          </div>

          <div className="p-6">
            {plugins.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">🔌</span>
                <h3 className="text-white text-lg font-medium mb-2">No plugins found</h3>
                <p className="text-gray-400 mb-6">Create your first plugin to get started</p>
                <button
                  onClick={() => navigate('/plugins/new')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                >
                  🚀 Create First Plugin
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {plugins.map((plugin) => (
                  <div key={plugin.id} className="bg-gray-700/30 hover:bg-gray-700/50 rounded-lg border border-gray-600/50 transition-all duration-200 hover:shadow-lg hover:border-gray-500/50">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xl">{getPluginIcon(plugin.type)}</span>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-lg">{plugin.name}</h3>
                            <p className="text-gray-400 text-sm">v{plugin.version}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${plugin.enabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <span className="text-gray-400 text-xs capitalize">{plugin.enabled ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{plugin.description}</p>

                      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                        <span className="flex items-center">
                          <span className="mr-1">👤</span>
                          {plugin.author || 'Unknown'}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">⚡</span>
                          {plugin.type}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleTogglePlugin(plugin)}
                            disabled={togglingPlugins.has(plugin.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              plugin.enabled 
                                ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400' 
                                : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                            } ${togglingPlugins.has(plugin.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {togglingPlugins.has(plugin.id) ? (
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              plugin.enabled ? '🔴 Disable' : '🟢 Enable'
                            )}
                          </button>

                          <button
                            onClick={() => navigate(`/plugins/${plugin.id}/edit`)}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-medium transition-colors"
                          >
                            ✏️ Edit
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeletePlugin(plugin)}
                          disabled={deletingPlugins.has(plugin.id)}
                          className={`px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs font-medium transition-colors ${
                            deletingPlugins.has(plugin.id) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {deletingPlugins.has(plugin.id) ? (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            '🗑️ Delete'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      
      {/* Admin Panel Modal */}
      <AdminPanel 
        isOpen={showAdminModal} 
        onClose={() => setShowAdminModal(false)} 
      />
    </div>
  );
}

export default Dashboard;