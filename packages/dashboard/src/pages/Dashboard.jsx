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
import { useTheme } from '../hooks/useTheme';
import AdminPanel from '../components/AdminPanel';
import CryptoSupport from '../components/CryptoSupport';
import GuildSelector from '../components/GuildSelector';
import HeartbeatIcon from '../components/HeartbeatIcon';

/**
 * Dashboard Component
 */
export function Dashboard() {
  const navigate = useNavigate();
  const { plugins, fetchPlugins, fetchGuildPlugins, deletePlugin, updatePlugin, togglePluginEnabled, toggleGuildPlugin, fetchGuildSettings, updateGuildSettings } = usePluginStore();
  const { apiStatus, botStatus, fetchBotStatus, user, logout, selectedGuildId, setSelectedGuildId, initializeGuildSelection } = useAppStore();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [loadingGuildPlugins, setLoadingGuildPlugins] = useState(false);
  const [loadingGuildSettings, setLoadingGuildSettings] = useState(false);
  const [togglingPlugins, setTogglingPlugins] = useState(new Set());
  const [deletingPlugins, setDeletingPlugins] = useState(new Set());
  const [showAdminTools, setShowAdminTools] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showCryptoSupport, setShowCryptoSupport] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [guildSettings, setGuildSettings] = useState({});
  const [showGuildSettings, setShowGuildSettings] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Initialize cached guild selection
    initializeGuildSelection();
    loadData();
  }, []);

  useEffect(() => {
    if (selectedGuild) {
      loadGuildPlugins();
      loadGuildSettings();
    }
  }, [selectedGuild]);

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

  /**
   * Handle guild selection with caching
   */
  const handleGuildSelect = (guild) => {
    setSelectedGuild(guild);
    setSelectedGuildId(guild.id);
  };

  const loadGuildSettings = async () => {
    if (!selectedGuild) return;
    
    setLoadingGuildSettings(true);
    try {
      const settings = await fetchGuildSettings(selectedGuild.id);
      setGuildSettings(settings.settings || {});
    } catch (error) {
      console.error('Failed to load guild settings:', error);
      toast.error(`❌ Failed to load settings for ${selectedGuild.name}`);
    } finally {
      setLoadingGuildSettings(false);
    }
  };

  const loadGuildPlugins = async () => {
    if (!selectedGuild) return;
    
    // Check if bot is present in the selected guild
    if (!selectedGuild.bot_present) {
      // Bot not present in guild, skipping plugin load
      return;
    }
    
    setLoadingGuildPlugins(true);
    try {
      await fetchGuildPlugins(selectedGuild.id);
    } catch (error) {
      console.error('Failed to load guild plugins:', error);
      toast.error(`❌ Failed to load plugins for ${selectedGuild.name}`);
    } finally {
      setLoadingGuildPlugins(false);
    }
  };

  const handleUpdatePlugin = async (pluginId, pluginData) => {
    try {
      await updatePlugin(pluginId, pluginData);
      toast.success(`✅ Plugin updated successfully`);
      
      // Reload guild plugins if a guild is selected
      if (selectedGuild) {
        await loadGuildPlugins();
      }
    } catch (error) {
      toast.error(`❌ Failed to update plugin: ${error.error || error.message}`);
    }
  };

  const handleUpdateGuildSettings = async (newSettings) => {
    if (!selectedGuild) return;
    
    try {
      await updateGuildSettings(selectedGuild.id, newSettings);
      setGuildSettings(newSettings);
      toast.success(`✅ Settings updated for ${selectedGuild.name}`);
    } catch (error) {
      toast.error(`❌ Failed to update settings: ${error.error || error.message}`);
    }
  };

  // Smart stats calculation based on guild selection and bot presence
  const getSmartStats = () => {
    // Safety check - ensure plugins is an array
    const safePlugins = Array.isArray(plugins) ? plugins : [];
    
    // If no guild selected, show global stats
    if (!selectedGuild) {
      return {
        totalPlugins: safePlugins.length,
        activePlugins: safePlugins.filter(p => p.enabled).length,
        slashCommands: safePlugins.filter(p => p.type === 'slash' || p.type === 'both').length,
        context: 'global'
      };
    }

    // If guild selected but bot not present, show 0 for plugin stats
    if (selectedGuild && !selectedGuild.bot_present) {
      return {
        totalPlugins: 0,
        activePlugins: 0,
        slashCommands: 0,
        context: 'bot-not-present'
      };
    }

    // If guild selected and bot present, show guild-specific stats
    return {
      totalPlugins: safePlugins.length,
      activePlugins: safePlugins.filter(p => p.guild_enabled !== false).length,
      slashCommands: safePlugins.filter(p => (p.type === 'slash' || p.type === 'both') && p.guild_enabled !== false).length,
      context: 'guild-specific'
    };
  };

  const smartStats = getSmartStats();

  const handleTogglePlugin = async (plugin) => {
    if (togglingPlugins.has(plugin.id)) return;
    
    setTogglingPlugins(prev => new Set(prev).add(plugin.id));
    try {
      if (selectedGuild) {
        // Use guild-specific toggle
        await toggleGuildPlugin(selectedGuild.id, plugin.id, !plugin.guild_enabled);
        toast.success(`${plugin.guild_enabled ? '🔴' : '🟢'} Plugin ${plugin.guild_enabled ? 'disabled' : 'enabled'} for ${selectedGuild.name}`);
      } else {
        // Use global toggle
        await togglePluginEnabled(plugin.id, !plugin.enabled);
        toast.success(`${plugin.enabled ? '🔴' : '🟢'} Plugin ${plugin.enabled ? 'disabled' : 'enabled'} globally`);
      }
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

  /**
   * Determine if plugin buttons should be disabled
   */
  const arePluginButtonsDisabled = () => {
    return loading || loadingGuildPlugins || loadingGuildSettings;
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

  const getBackgroundClass = () => {
    return 'min-h-screen bg-transparent'; // Always use space theme
  };

  return (
    <div className={getBackgroundClass()}>
      {/* Modern Header */}
      <header className="sticky top-0 z-40 macos-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 macos-icon flex items-center justify-center">
                  <img 
                    src="/assets/dismodularjs.png" 
                    alt="DisModular.js Logo" 
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-white text-xl font-bold">Discord Bot Admin</h1>
                  <p className="text-gray-400 text-xs">Modular Plugin System</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* API Status */}
              <div className="macos-badge flex items-center space-x-2">
                <HeartbeatIcon status={apiStatus?.api_status} size="sm" />
                <span className={`text-sm font-medium ${getStatusColor(apiStatus?.api_status)}`}>
                  API
                </span>
              </div>

              {/* Bot Status */}
              <div className="macos-badge flex items-center space-x-2">
                <HeartbeatIcon status={botStatus?.bot_status} size="sm" />
                <span className={`text-sm font-medium ${getStatusColor(botStatus?.bot_status)}`}>
                  Bot
                </span>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                {user?.data?.is_admin && (
                  <button
                    onClick={() => setShowAdminTools(!showAdminTools)}
                    className="macos-button flex items-center space-x-2"
                  >
                    <span className="text-blue-400">👑</span>
                    <span className="text-blue-400 text-sm font-medium">Admin</span>
                  </button>
                )}

                <button
                  onClick={() => setShowCryptoSupport(true)}
                  className="macos-button flex items-center space-x-2 bg-gradient-to-r from-energy-green/20 to-hologram-500/20 hover:from-energy-green/30 hover:to-hologram-500/30"
                >
                  <span className="text-energy-green">💎</span>
                  <span className="text-energy-green text-sm font-medium">Support</span>
                </button>

                <div className="macos-badge flex items-center space-x-2">
                  <img 
                    src={user?.data?.avatar ? `https://cdn.discordapp.com/avatars/${user.data.discord_id}/${user.data.avatar}.png` : '/default-avatar.png'} 
                    alt={user?.data?.username} 
                    className="w-6 h-6 rounded-full"
                    onError={(e) => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiM2MzY2RjEiLz4KPHN2Zz4K'; }}
                  />
                  <span className="text-white text-sm font-medium">{user?.data?.username}</span>
                </div>

                <button
                  onClick={logout}
                  className="macos-button px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400"
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
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2 flex items-center">
                  <span className="mr-2">👥</span> User Management
                </h3>
                <p className="text-gray-400 text-sm mb-3">Manage admin users and permissions</p>
                <button 
                  onClick={() => setShowAdminModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  Manage Users
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
          <div className="macos-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-hologram-200 text-sm font-medium">
                  Total Plugins
                </p>
                {smartStats.context === 'bot-not-present' && (
                  <span className="text-xs text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded">Bot not present</span>
                )}
                {smartStats.context === 'guild-specific' && (
                  <span className="text-xs text-hologram-cyan bg-hologram-cyan/20 px-2 py-0.5 rounded">{selectedGuild?.name}</span>
                )}
                <p className="text-white text-2xl font-bold">{smartStats.totalPlugins}</p>
              </div>
              <span className="text-3xl">🔌</span>
            </div>
          </div>

          <div className="macos-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-energy-green text-sm font-medium">
                  Active Plugins
                </p>
                {smartStats.context === 'bot-not-present' && (
                  <span className="text-xs text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded">Bot not present</span>
                )}
                {smartStats.context === 'guild-specific' && (
                  <span className="text-xs text-hologram-cyan bg-hologram-cyan/20 px-2 py-0.5 rounded">{selectedGuild?.name}</span>
                )}
                <p className="text-white text-2xl font-bold">{smartStats.activePlugins}</p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>

          <div className="macos-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm font-medium">
                  Slash Commands
                </p>
                {smartStats.context === 'bot-not-present' && (
                  <span className="text-xs text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded">Bot not present</span>
                )}
                {smartStats.context === 'guild-specific' && (
                  <span className="text-xs text-hologram-cyan bg-hologram-cyan/20 px-2 py-0.5 rounded">{selectedGuild?.name}</span>
                )}
                <p className="text-white text-2xl font-bold">{smartStats.slashCommands}</p>
              </div>
              <span className="text-3xl">⚡</span>
            </div>
          </div>

          <div className="macos-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-nebula-purple text-sm font-medium">API Status</p>
                <p className="text-white text-lg font-bold capitalize">{apiStatus?.api_status || 'Unknown'}</p>
              </div>
              <HeartbeatIcon status={apiStatus?.api_status} size="lg" />
            </div>
          </div>
        </div>

        {/* Guild Selection */}
        <div className="mb-8">
          <GuildSelector 
            selectedGuild={selectedGuild}
            onGuildSelect={handleGuildSelect}
            cachedGuildId={selectedGuildId}
          />
        </div>

        {/* Plugins Section */}
        <div className={`rounded-xl shadow-xl ${
          theme === 'space'
            ? 'glass cosmic-border'
            : 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50'
        }`}>
          <div className={`p-6 ${
            theme === 'space' 
              ? 'border-b border-hologram-500/30' 
              : 'border-b border-gray-700/50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-xl font-bold flex items-center">
                  <span className="mr-2">🔌</span> Plugin Management
                  {selectedGuild && (
                    <span className="ml-2 text-sm font-normal text-hologram-cyan">
                      for {selectedGuild.name}
                    </span>
                  )}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedGuild ? `Manage plugins for ${selectedGuild.name}` : 'Manage your Discord bot plugins globally'}
                </p>
                {selectedGuild && !selectedGuild.bot_present && (
                  <div className="mt-3 p-3 macos-glass rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                    <div className="flex items-center gap-2 text-yellow-300">
                      <span className="text-lg">⚠️</span>
                      <span className="text-sm font-medium">
                        Bot not present in this server. Please invite the bot to start using plugins.
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {selectedGuild && (
                  <button
                    onClick={() => setShowGuildSettings(true)}
                    disabled={!selectedGuild.bot_present || arePluginButtonsDisabled()}
                    className={`macos-button px-4 py-2 transition-all duration-200 ${
                      !selectedGuild.bot_present || arePluginButtonsDisabled()
                        ? 'text-gray-500 cursor-not-allowed opacity-50'
                        : 'text-white hover:scale-105'
                    }`}
                    title={
                      arePluginButtonsDisabled() 
                        ? 'Please wait for data to load...' 
                        : !selectedGuild.bot_present 
                          ? 'Bot must be present in server to modify settings' 
                          : 'Configure guild-specific settings'
                    }
                  >
                    {loadingGuildSettings ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      '⚙️ Guild Settings'
                    )}
                  </button>
                )}
                <button
                  onClick={() => navigate('/plugins/new')}
                  disabled={selectedGuild && !selectedGuild.bot_present || arePluginButtonsDisabled()}
                  className={`macos-button px-6 py-3 font-medium flex items-center gap-2 transition-all duration-200 ${
                    (selectedGuild && !selectedGuild.bot_present) || arePluginButtonsDisabled()
                      ? 'text-gray-500 cursor-not-allowed opacity-50'
                      : 'text-white hover:scale-105'
                  }`}
                  title={
                    arePluginButtonsDisabled() 
                      ? 'Please wait for data to load...' 
                      : selectedGuild && !selectedGuild.bot_present 
                        ? 'Bot must be present in server to create plugins' 
                        : 'Create a new plugin'
                  }
                >
                  {arePluginButtonsDisabled() ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-lg">➕</span>
                      <span>Create Plugin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loadingGuildPlugins ? (
              <div className="text-center py-12">
                <div className="macos-card p-8 inline-block">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hologram-cyan mx-auto mb-4"></div>
                  <h3 className="text-white text-lg font-medium mb-2">Loading Plugins</h3>
                  <p className="text-gray-400 text-sm">
                    Loading plugins for <strong>{selectedGuild?.name}</strong>...
                  </p>
                </div>
              </div>
            ) : selectedGuild && !selectedGuild.bot_present ? (
              <div className="text-center py-12">
                <img 
                  src="/assets/dismodularjs.png" 
                  alt="DisModular.js Logo" 
                  className="w-16 h-16 object-contain mx-auto mb-4"
                />
                <h3 className="text-white text-lg font-medium mb-2">Bot Not Present</h3>
                <p className="text-gray-400 mb-6">
                  The bot is not present in <strong>{selectedGuild.name}</strong>. 
                  Please invite the bot to this server to manage plugins.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => window.open(selectedGuild.bot_invite_url, '_blank')}
                    className="macos-button px-6 py-3 text-white font-medium flex items-center gap-2 hover:scale-105 transition-all duration-200"
                  >
                    <span className="text-lg">➕</span>
                    <span>Invite Bot to Server</span>
                  </button>
                  <button
                    onClick={() => setSelectedGuild(null)}
                    className="macos-button px-6 py-3 text-gray-300 font-medium flex items-center gap-2 hover:scale-105 transition-all duration-200 bg-gray-600/20 hover:bg-gray-600/30"
                  >
                    <span className="text-lg">🔄</span>
                    <span>Select Different Server</span>
                  </button>
                </div>
              </div>
            ) : (Array.isArray(plugins) ? plugins : []).length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">🔌</span>
                <h3 className="text-white text-lg font-medium mb-2">No plugins found</h3>
                <p className="text-gray-400 mb-6">
                  {selectedGuild && !selectedGuild.bot_present 
                    ? 'Bot must be present in server to create plugins'
                    : 'Create your first plugin to get started'
                  }
                </p>
                <button
                  onClick={() => navigate('/plugins/new')}
                  disabled={(selectedGuild && !selectedGuild.bot_present) || arePluginButtonsDisabled()}
                  className={`macos-button px-6 py-3 font-medium flex items-center gap-2 transition-all duration-200 mx-auto ${
                    (selectedGuild && !selectedGuild.bot_present) || arePluginButtonsDisabled()
                      ? 'text-gray-500 cursor-not-allowed opacity-50'
                      : 'text-white hover:scale-105'
                  }`}
                  title={
                    arePluginButtonsDisabled() 
                      ? 'Please wait for data to load...' 
                      : selectedGuild && !selectedGuild.bot_present 
                        ? 'Bot must be present in server to create plugins' 
                        : 'Create your first plugin'
                  }
                >
                  {arePluginButtonsDisabled() ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-lg">🚀</span>
                      <span>Create First Plugin</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {(Array.isArray(plugins) ? plugins : []).map((plugin) => {
                  const isActive = selectedGuild ? plugin.guild_enabled : plugin.enabled;
                  const statusColor = isActive ? 'energy-green' : 'red-400';
                  const statusEmoji = isActive ? '🟢' : '🔴';
                  
                  return (
                    <div 
                      key={plugin.id} 
                      className={`macos-card transition-all duration-300 hover:scale-[1.02] border-2 ${
                        isActive 
                          ? 'border-energy-green/50 shadow-energy-green/20 shadow-lg' 
                          : 'border-red-400/50 shadow-red-400/20 shadow-lg'
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 macos-icon flex items-center justify-center">
                              <span className="text-white text-xl">{getPluginIcon(plugin.type)}</span>
                            </div>
                            <div>
                              <h3 className="text-white font-semibold text-lg">{plugin.name}</h3>
                              <p className="text-gray-400 text-sm">v{plugin.version}</p>
                            </div>
                          </div>
                          
                          <div className={`macos-badge flex items-center space-x-2 ${
                            isActive 
                              ? 'bg-energy-green/20 border-energy-green/30' 
                              : 'bg-red-400/20 border-red-400/30'
                          }`}>
                            <span className="text-lg">{statusEmoji}</span>
                            <span className={`text-xs font-medium capitalize ${
                              isActive ? 'text-energy-green' : 'text-red-400'
                            }`}>
                              {selectedGuild ? (plugin.guild_enabled ? 'Active' : 'Inactive') : (plugin.enabled ? 'Active' : 'Inactive')}
                            </span>
                            {selectedGuild && plugin.enabled !== plugin.guild_enabled && (
                              <span className="text-xs text-gray-400">
                                ({plugin.enabled ? 'Global' : 'Disabled'})
                              </span>
                            )}
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
                            disabled={togglingPlugins.has(plugin.id) || arePluginButtonsDisabled()}
                            className={`macos-button text-xs font-medium ${
                              selectedGuild ? (plugin.guild_enabled 
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30 hover:border-red-500/50' 
                                : 'bg-energy-green/20 hover:bg-energy-green/30 text-energy-green border-energy-green/30 hover:border-energy-green/50')
                                : (plugin.enabled 
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30 hover:border-red-500/50' 
                                : 'bg-energy-green/20 hover:bg-energy-green/30 text-energy-green border-energy-green/30 hover:border-energy-green/50')
                            } ${(togglingPlugins.has(plugin.id) || arePluginButtonsDisabled()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={
                              arePluginButtonsDisabled() 
                                ? 'Please wait for data to load...' 
                                : togglingPlugins.has(plugin.id) 
                                  ? 'Toggling plugin...' 
                                  : selectedGuild 
                                    ? (plugin.guild_enabled ? 'Disable plugin for this guild' : 'Enable plugin for this guild')
                                    : (plugin.enabled ? 'Disable plugin globally' : 'Enable plugin globally')
                            }
                          >
                            {togglingPlugins.has(plugin.id) ? (
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              selectedGuild ? (plugin.guild_enabled ? '🔴 Disable' : '🟢 Enable') : (plugin.enabled ? '🔴 Disable' : '🟢 Enable')
                            )}
                          </button>

                          <button
                            onClick={() => navigate(`/plugins/${plugin.id}/edit`)}
                            disabled={arePluginButtonsDisabled()}
                            className={`macos-button text-xs font-medium bg-hologram-500/20 hover:bg-hologram-500/30 text-hologram-cyan border-hologram-500/30 hover:border-hologram-500/50 ${
                              arePluginButtonsDisabled() ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title={
                              arePluginButtonsDisabled() 
                                ? 'Please wait for data to load...' 
                                : 'Edit plugin configuration'
                            }
                          >
                            ✏️ Edit
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeletePlugin(plugin)}
                          disabled={deletingPlugins.has(plugin.id) || arePluginButtonsDisabled()}
                          className={`macos-button text-xs font-medium ${
                            (deletingPlugins.has(plugin.id) || arePluginButtonsDisabled())
                              ? 'opacity-50 cursor-not-allowed bg-gray-500/20 text-gray-400 border-gray-500/30' 
                              : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30 hover:border-red-500/50'
                          }`}
                          title={
                            arePluginButtonsDisabled() 
                              ? 'Please wait for data to load...' 
                              : deletingPlugins.has(plugin.id) 
                                ? 'Deleting plugin...' 
                                : 'Delete this plugin permanently'
                          }
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Guild Settings Modal */}
      {showGuildSettings && selectedGuild && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="macos-card p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Guild Settings</h3>
              <button
                onClick={() => setShowGuildSettings(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Guild Name
                </label>
                <input
                  type="text"
                  value={selectedGuild.name}
                  disabled
                  className="w-full px-3 py-2 macos-glass rounded-lg text-white bg-transparent border-0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bot Prefix
                </label>
                <input
                  type="text"
                  value={guildSettings.prefix || '!'}
                  onChange={(e) => setGuildSettings(prev => ({ ...prev, prefix: e.target.value }))}
                  className="w-full px-3 py-2 macos-glass rounded-lg text-white bg-transparent border-0"
                  placeholder="!"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Welcome Message
                </label>
                <textarea
                  value={guildSettings.welcomeMessage || ''}
                  onChange={(e) => setGuildSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  className="w-full px-3 py-2 macos-glass rounded-lg text-white bg-transparent border-0 h-20 resize-none"
                  placeholder="Welcome to the server!"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoModeration"
                  checked={guildSettings.autoModeration || false}
                  onChange={(e) => setGuildSettings(prev => ({ ...prev, autoModeration: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoModeration" className="text-sm text-gray-300">
                  Enable Auto Moderation
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGuildSettings(false)}
                className="macos-button px-4 py-2 text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleUpdateGuildSettings(guildSettings);
                  setShowGuildSettings(false);
                }}
                className="macos-button px-4 py-2 text-white bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 hover:border-blue-500/50"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      
      {/* Admin Panel Modal */}
      <AdminPanel 
        isOpen={showAdminModal} 
        onClose={() => setShowAdminModal(false)} 
      />
      
      {/* Crypto Support Modal */}
      <CryptoSupport 
        isOpen={showCryptoSupport} 
        onClose={() => setShowCryptoSupport(false)} 
      />
    </div>
  );
}

export default Dashboard;