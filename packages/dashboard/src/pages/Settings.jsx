/**
 * Settings Page
 * Bot configuration and settings management
 * @author fkndean_
 * @date 2025-10-14
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import api from '../services/api';

export function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Settings state
  const [settings, setSettings] = useState({
    prefix: '!',
    cooldown_seconds: 3,
    log_level: 'info',
    max_plugins: 50,
    backup_enabled: false,
    backup_interval_hours: 24
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.bot.getConfig();
      // Convert config array to object
      const configObj = {};
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(item => {
          configObj[item.key] = item.value;
        });
      }
      
      setSettings(prev => ({
        ...prev,
        ...configObj,
        prefix: configObj.prefix || '!',
        cooldown_seconds: parseInt(configObj.cooldown_seconds) || 3,
        log_level: configObj.log_level || 'info',
        max_plugins: parseInt(configObj.max_plugins) || 50,
        backup_enabled: configObj.backup_enabled === 'true',
        backup_interval_hours: parseInt(configObj.backup_interval_hours) || 24
      }));
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each setting individually
      for (const [key, value] of Object.entries(settings)) {
        await api.bot.updateConfig(key, String(value));
      }
      
      toast.success('✅ Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'commands', label: 'Commands', icon: '⚡' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white text-xl font-medium">⚙️ Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="text-white text-xl">←</span>
              </button>
              <div>
                <h1 className="text-white text-xl font-bold flex items-center">
                  <span className="mr-2">⚙️</span> Bot Settings
                </h1>
                <p className="text-gray-400 text-xs">Configure bot behavior and preferences</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 ${saving ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
            >
              {saving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {saving ? 'Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-2 mb-6 bg-gray-800/50 p-2 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Command Prefix
                </label>
                <input
                  type="text"
                  value={settings.prefix}
                  onChange={(e) => handleChange('prefix', e.target.value)}
                  maxLength={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="!"
                />
                <p className="text-gray-400 text-sm mt-2">
                  The character(s) used to trigger text commands (e.g., !hello)
                </p>
              </div>
            </div>
          )}

          {/* Commands Tab */}
          {activeTab === 'commands' && (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Global Cooldown (seconds)
                </label>
                <input
                  type="number"
                  value={settings.cooldown_seconds}
                  onChange={(e) => handleChange('cooldown_seconds', parseInt(e.target.value) || 0)}
                  min="0"
                  max="60"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-400 text-sm mt-2">
                  Minimum time between commands from the same user
                </p>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Maximum Active Plugins
                </label>
                <input
                  type="number"
                  value={settings.max_plugins}
                  onChange={(e) => handleChange('max_plugins', parseInt(e.target.value) || 0)}
                  min="1"
                  max="100"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-400 text-sm mt-2">
                  Maximum number of plugins that can be enabled simultaneously
                </p>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Logging Level
                </label>
                <select
                  value={settings.log_level}
                  onChange={(e) => handleChange('log_level', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="debug">Debug (Verbose)</option>
                  <option value="info">Info (Default)</option>
                  <option value="warn">Warn (Important only)</option>
                  <option value="error">Error (Critical only)</option>
                </select>
                <p className="text-gray-400 text-sm mt-2">
                  Controls the verbosity of bot logging
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.backup_enabled}
                    onChange={(e) => handleChange('backup_enabled', e.target.checked)}
                    className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-white font-medium">Enable Automatic Backups</span>
                </label>
                <p className="text-gray-400 text-sm mt-2 ml-8">
                  Automatically backup database at regular intervals
                </p>
              </div>

              {settings.backup_enabled && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    Backup Interval (hours)
                  </label>
                  <input
                    type="number"
                    value={settings.backup_interval_hours}
                    onChange={(e) => handleChange('backup_interval_hours', parseInt(e.target.value) || 24)}
                    min="1"
                    max="168"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    How often to create database backups (1-168 hours)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-blue-400 text-lg">💡</span>
            <div>
              <h4 className="text-blue-400 font-medium text-sm">Settings Note</h4>
              <p className="text-gray-400 text-xs mt-1">
                Some settings may require a bot restart to take effect. Changes are saved immediately but applied on next bot startup.
              </p>
            </div>
          </div>
        </div>
      </main>

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  );
}

export default Settings;

