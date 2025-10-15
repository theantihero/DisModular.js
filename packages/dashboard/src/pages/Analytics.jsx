/**
 * Analytics Page
 * Real-time bot analytics and metrics dashboard
 * @author fkndean_
 * @date 2025-10-14
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import api from '../services/api';

export function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.admin.getAnalytics();
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white text-xl font-medium">📊 Loading analytics...</p>
        </div>
      </div>
    );
  }

  const getMaxHourlyCount = () => {
    if (!analytics?.hourlyUsage || analytics.hourlyUsage.length === 0) return 1;
    return Math.max(...analytics.hourlyUsage.map(h => h.count), 1);
  };

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
                  <span className="mr-2">📊</span> Analytics Dashboard
                </h1>
                <p className="text-gray-400 text-xs">Real-time bot metrics and performance</p>
              </div>
            </div>
            <div className="text-gray-400 text-sm">
              <span className="mr-2">🔄</span> Auto-refreshing every 10s
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm font-medium">Total Commands</span>
              <span className="text-3xl">⚡</span>
            </div>
            <p className="text-white text-3xl font-bold">{analytics?.totalCommands?.all || 0}</p>
            <p className="text-blue-100 text-xs mt-2">
              {analytics?.totalCommands?.day || 0} today • {analytics?.totalCommands?.week || 0} this week
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100 text-sm font-medium">Active Users</span>
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-white text-3xl font-bold">{analytics?.uniqueUsers?.all || 0}</p>
            <p className="text-green-100 text-xs mt-2">
              {analytics?.uniqueUsers?.day || 0} today • {analytics?.uniqueUsers?.week || 0} this week
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100 text-sm font-medium">Success Rate</span>
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-white text-3xl font-bold">{analytics?.successRate || 0}%</p>
            <p className="text-purple-100 text-xs mt-2">
              Command execution success rate
            </p>
          </div>

          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-100 text-sm font-medium">Avg Response</span>
              <span className="text-3xl">⏱️</span>
            </div>
            <p className="text-white text-3xl font-bold">{analytics?.avgExecutionTime || 0}ms</p>
            <p className="text-yellow-100 text-xs mt-2">
              Average command execution time
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Usage Chart */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl p-6">
            <h2 className="text-white text-lg font-bold mb-4 flex items-center">
              <span className="mr-2">📈</span> Hourly Usage (Last 24h)
            </h2>
            <div className="space-y-2">
              {analytics?.hourlyUsage && analytics.hourlyUsage.length > 0 ? (
                analytics.hourlyUsage.map((item) => (
                  <div key={item.hour} className="flex items-center space-x-3">
                    <span className="text-gray-400 text-sm w-12">{item.hour}:00</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-full flex items-center justify-end px-2"
                        style={{ width: `${(item.count / getMaxHourlyCount()) * 100}%` }}
                      >
                        <span className="text-white text-xs font-medium">{item.count}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No data available yet</p>
              )}
            </div>
          </div>

          {/* Top Plugins */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl p-6">
            <h2 className="text-white text-lg font-bold mb-4 flex items-center">
              <span className="mr-2">🏆</span> Top Plugins
            </h2>
            <div className="space-y-3">
              {analytics?.topPlugins && analytics.topPlugins.length > 0 ? (
                analytics.topPlugins.map((plugin, index) => (
                  <div key={plugin.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔹'}
                      </span>
                      <span className="text-white font-medium">{plugin.name}</span>
                    </div>
                    <span className="text-gray-400 font-medium">{plugin.count} uses</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No plugin usage data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl p-6 mt-6">
          <h2 className="text-white text-lg font-bold mb-4 flex items-center">
            <span className="mr-2">🕐</span> Recent Activity
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 text-sm font-medium pb-3">Command</th>
                  <th className="text-left text-gray-400 text-sm font-medium pb-3">User</th>
                  <th className="text-left text-gray-400 text-sm font-medium pb-3">Plugin</th>
                  <th className="text-left text-gray-400 text-sm font-medium pb-3">Status</th>
                  <th className="text-left text-gray-400 text-sm font-medium pb-3">Time</th>
                  <th className="text-left text-gray-400 text-sm font-medium pb-3">Executed</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                  analytics.recentActivity.map((activity, index) => (
                    <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                      <td className="py-3 text-white">{activity.command_name}</td>
                      <td className="py-3 text-gray-300">{activity.username || 'Unknown'}</td>
                      <td className="py-3 text-gray-300">{activity.plugin_name}</td>
                      <td className="py-3">
                        {activity.success ? (
                          <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full font-medium">
                            ✅ Success
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-full font-medium" title={activity.error_message}>
                            ❌ Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-gray-300">{activity.execution_time_ms}ms</td>
                      <td className="py-3 text-gray-400 text-sm">
                        {new Date(activity.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">
                      No activity recorded yet. Run some commands to see data!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </div>
  );
}

export default Analytics;

