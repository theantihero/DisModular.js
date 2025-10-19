import _React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../hooks/useToast';

/**
 * User Management Panel Component
 * Provides comprehensive user management with access control and macOS theming
 * @param {Object} props - Component props
 * @returns {JSX.Element} UserManagementPanel component
 */
export function UserManagementPanel() {
  // UserManagementPanel component rendered
  
  const { success, error } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug users state changes
  useEffect(() => {
    // Users state changed
  }, [users]);

  /**
   * Load all users from the API
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      // Loading users
      const response = await api.admin.getUsers();
      // API Response received
      
      if (response.success) {
        // Setting users data
        setUsers(response.data);
      } else {
        console.error('❌ API returned error:', response.error);
        error('Failed to load users');
      }
    } catch (error) {
      console.error('💥 Error loading users:', error);
      error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle revoke access action
   */
  const handleRevokeAccess = async () => {
    if (!selectedUser || !actionMessage.trim()) {
      error('Please provide a reason for revoking access');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.admin.revokeAccess(selectedUser.id, actionMessage);
      
      if (response.success) {
        success('User access revoked successfully');
        setShowRevokeModal(false);
        setActionMessage('');
        setSelectedUser(null);
        loadUsers(); // Refresh the user list
      } else {
        error(response.error || 'Failed to revoke access');
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      error('Failed to revoke access');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handle grant access action
   */
  const handleGrantAccess = async () => {
    if (!selectedUser) {
      error('No user selected');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.admin.grantAccess(selectedUser.id, actionMessage);
      
      if (response.success) {
        success('User access granted successfully');
        setShowGrantModal(false);
        setActionMessage('');
        setSelectedUser(null);
        loadUsers(); // Refresh the user list
      } else {
        error(response.error || 'Failed to grant access');
      }
    } catch (error) {
      console.error('Error granting access:', error);
      error('Failed to grant access');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Get status badge styling
   */
  const _getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'denied':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`;
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Filter and sort users based on search term, status, and sorting options
   */
  // Current users state
  
  const safeUsers = Array.isArray(users) ? users : [];
  const filteredAndSortedUsers = safeUsers
    .filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.discord_id.includes(searchTerm) ||
                           (user.guilds && user.guilds.some(guild => 
                             guild.name.toLowerCase().includes(searchTerm.toLowerCase())
                           ));
      const matchesStatus = filterStatus === 'all' || user.access_status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'last_activity':
          aValue = new Date(a.last_activity || 0);
          bValue = new Date(b.last_activity || 0);
          break;
        case 'command_count':
          aValue = a.command_count || 0;
          bValue = b.command_count || 0;
          break;
        case 'total_plugins':
          aValue = a.total_plugins || 0;
          bValue = b.total_plugins || 0;
          break;
        case 'guilds_count':
          aValue = a.guilds?.length || 0;
          bValue = b.guilds?.length || 0;
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Filtered and sorted users

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="macos-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hologram-cyan mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      <div className="glass p-6 rounded-xl border border-hologram-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1 flex items-center">
              <span className="mr-2">👥</span>
              User Management
            </h3>
            <p className="text-gray-400 text-sm">
              Manage user access, permissions, and bot interactions
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-hologram-cyan text-sm">
              {filteredAndSortedUsers.length} of {safeUsers.length} users
            </div>
            <button
              onClick={loadUsers}
              className="macos-button px-4 py-2 text-hologram-cyan hover:text-white transition-all duration-200"
            >
              <span className="mr-2">🔄</span>Refresh
            </button>
          </div>
        </div>

        {/* Enhanced Filters with macOS styling */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users, Discord IDs, or guilds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 glass border border-hologram-500/30 rounded-xl text-white placeholder-gray-400 focus:glass-strong focus:border-hologram-500 transition-all duration-200"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 glass border border-hologram-500/30 rounded-xl text-white focus:glass-strong focus:border-hologram-500 transition-all duration-200"
            >
              <option value="all">All Users</option>
              <option value="approved">✅ Approved</option>
              <option value="pending">⏳ Pending</option>
              <option value="denied">❌ Denied</option>
            </select>
          </div>
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full px-4 py-3 glass border border-hologram-500/30 rounded-xl text-white focus:glass-strong focus:border-hologram-500 transition-all duration-200"
            >
              <option value="created_at-desc">📅 Newest First</option>
              <option value="created_at-asc">📅 Oldest First</option>
              <option value="username-asc">👤 Name A-Z</option>
              <option value="username-desc">👤 Name Z-A</option>
              <option value="last_activity-desc">🕒 Recent Activity</option>
              <option value="command_count-desc">⚡ Most Commands</option>
              <option value="total_plugins-desc">🔌 Most Plugins</option>
              <option value="guilds_count-desc">🏰 Most Guilds</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Grid with macOS styling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAndSortedUsers.map((user) => (
          <div key={user.id} className="glass p-6 hover:glass-strong transition-all duration-300 group rounded-xl border border-hologram-500/20">
            {/* User Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {user.avatar ? (
                    <img
                      className="h-12 w-12 rounded-full border-2 border-hologram-500/30"
                      src={`https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png`}
                      alt={user.username}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full glass border-2 border-hologram-500/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Status indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
                    user.access_status === 'approved' ? 'bg-green-500' :
                    user.access_status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {user.username}
                    {user.discriminator && user.discriminator !== '0' && (
                      <span className="text-gray-400 text-sm ml-1">#{user.discriminator}</span>
                    )}
                  </h3>
                  <p className="text-gray-400 text-sm">{user.discord_id}</p>
                </div>
              </div>
              {user.is_admin && (
                <div className="px-3 py-1 glass border border-hologram-500/30 rounded-full">
                  <span className="text-hologram-cyan text-xs font-medium">👑 Admin</span>
                </div>
              )}
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 glass border border-hologram-500/20 rounded-lg">
                <div className="text-2xl font-bold text-white">{user.command_count || 0}</div>
                <div className="text-xs text-gray-400">Commands</div>
              </div>
              <div className="text-center p-3 glass border border-hologram-500/20 rounded-lg">
                <div className="text-2xl font-bold text-white">{user.total_plugins || 0}</div>
                <div className="text-xs text-gray-400">Plugins</div>
              </div>
              <div className="text-center p-3 glass border border-hologram-500/20 rounded-lg">
                <div className="text-2xl font-bold text-white">{user.guilds?.length || 0}</div>
                <div className="text-xs text-gray-400">Guilds</div>
              </div>
              <div className="text-center p-3 glass border border-hologram-500/20 rounded-lg">
                <div className="text-lg font-bold text-white">
                  {user.access_status === 'approved' ? '✅' : 
                   user.access_status === 'pending' ? '⏳' : '❌'}
                </div>
                <div className="text-xs text-gray-400">Status</div>
              </div>
            </div>

            {/* Guild List */}
            {user.guilds && user.guilds.length > 0 && (
              <div className="mb-4">
                <h4 className="text-white text-sm font-medium mb-2 flex items-center">
                  <span className="mr-2">🏰</span>Guilds ({(user.guilds || []).length})
                </h4>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {(user.guilds || []).slice(0, 3).map((guild) => (
                    <div key={guild.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300 truncate">{guild.name}</span>
                      <div className="flex items-center space-x-1">
                        {guild.is_admin && <span className="text-hologram-cyan">👑</span>}
                        {guild.enabled && <span className="text-green-400">●</span>}
                      </div>
                    </div>
                  ))}
                  {user.guilds.length > 3 && (
                    <div className="text-xs text-gray-400 text-center">
                      +{user.guilds.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Last Activity */}
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-1">Last Activity</div>
              <div className="text-sm text-white">
                {formatDate(user.last_activity)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedUser(user);
                  setShowUserDetails(true);
                }}
                className="flex-1 macos-button px-3 py-2 text-xs text-hologram-cyan hover:text-white transition-all duration-200"
              >
                <span className="mr-1">👁️</span>Details
              </button>
              {user.access_status === 'approved' && !user.is_admin && (
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowRevokeModal(true);
                  }}
                  className="flex-1 macos-button px-3 py-2 text-xs text-red-400 hover:text-red-300 transition-all duration-200"
                >
                  <span className="mr-1">🚫</span>Revoke
                </button>
              )}
              {user.access_status !== 'approved' && !user.is_admin && (
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowGrantModal(true);
                  }}
                  className="flex-1 macos-button px-3 py-2 text-xs text-green-400 hover:text-green-300 transition-all duration-200"
                >
                  <span className="mr-1">✅</span>Grant
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {filteredAndSortedUsers.length === 0 && (
        <div className="glass p-12 text-center rounded-xl border border-hologram-500/20">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
          <p className="text-gray-400">
            No users match your current search criteria. Try adjusting your filters.
          </p>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-hologram-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-3 text-2xl">👤</span>
                User Details: {selectedUser.username}
              </h3>
              <button
                onClick={() => {
                  setShowUserDetails(false);
                  setSelectedUser(null);
                }}
                className="macos-button p-3 text-gray-400 hover:text-white transition-all duration-200"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Info */}
              <div className="space-y-4">
                <div className="macos-card p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <span className="mr-2">ℹ️</span>Basic Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Discord ID:</span>
                      <span className="text-white font-mono">{selectedUser.discord_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Username:</span>
                      <span className="text-white">{selectedUser.username}#{selectedUser.discriminator}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedUser.access_status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        selectedUser.access_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {selectedUser.access_status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Admin:</span>
                      <span className="text-white">{selectedUser.is_admin ? '👑 Yes' : '❌ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Joined:</span>
                      <span className="text-white">{formatDate(selectedUser.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Login:</span>
                      <span className="text-white">{formatDate(selectedUser.last_login)}</span>
                    </div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="macos-card p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <span className="mr-2">📊</span>Activity Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 glass border border-hologram-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-white">{selectedUser.command_count || 0}</div>
                      <div className="text-xs text-gray-400">Commands Executed</div>
                    </div>
                    <div className="text-center p-3 glass border border-hologram-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-white">{selectedUser.total_plugins || 0}</div>
                      <div className="text-xs text-gray-400">Plugins Created</div>
                    </div>
                    <div className="text-center p-3 glass border border-hologram-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-white">{selectedUser.guilds?.length || 0}</div>
                      <div className="text-xs text-gray-400">Guilds Managed</div>
                    </div>
                    <div className="text-center p-3 glass border border-hologram-500/20 rounded-lg">
                      <div className="text-2xl font-bold text-white">{selectedUser.recent_activity?.length || 0}</div>
                      <div className="text-xs text-gray-400">Recent Actions</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guilds and Activity */}
              <div className="space-y-4">
                {/* Guilds */}
                {selectedUser.guilds && selectedUser.guilds.length > 0 && (
                  <div className="macos-card p-4">
                    <h4 className="text-white font-semibold mb-3 flex items-center">
                      <span className="mr-2">🏰</span>Guild Permissions ({(selectedUser.guilds || []).length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(selectedUser.guilds || []).map((guild) => (
                        <div key={guild.id} className="flex items-center justify-between p-3 glass border border-hologram-500/20 rounded-lg">
                          <div>
                            <div className="text-white font-medium">{guild.name}</div>
                            <div className="text-xs text-gray-400 font-mono">{guild.id}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {guild.is_admin && <span className="text-hologram-cyan text-sm">👑 Admin</span>}
                            {guild.enabled && <span className="text-green-400 text-sm">● Active</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                {selectedUser.recent_activity && selectedUser.recent_activity.length > 0 && (
                  <div className="macos-card p-4">
                    <h4 className="text-white font-semibold mb-3 flex items-center">
                      <span className="mr-2">🕒</span>Recent Activity
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(selectedUser.recent_activity || []).map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-2 glass border border-hologram-500/20 rounded-lg">
                          <div>
                            <div className="text-white text-sm">{activity.action}</div>
                            {activity.details && (
                              <div className="text-xs text-gray-400">{JSON.stringify(activity.details)}</div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(activity.created_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-hologram-500/30">
              {selectedUser.access_status === 'approved' && !selectedUser.is_admin && (
                <button
                  onClick={() => {
                    setShowUserDetails(false);
                    setShowRevokeModal(true);
                  }}
                  className="macos-button px-4 py-2 text-red-400 hover:text-red-300 transition-all duration-200"
                >
                  <span className="mr-2">🚫</span>Revoke Access
                </button>
              )}
              {selectedUser.access_status !== 'approved' && !selectedUser.is_admin && (
                <button
                  onClick={() => {
                    setShowUserDetails(false);
                    setShowGrantModal(true);
                  }}
                  className="macos-button px-4 py-2 text-green-400 hover:text-green-300 transition-all duration-200"
                >
                  <span className="mr-2">✅</span>Grant Access
                </button>
              )}
              <button
                onClick={() => {
                  setShowUserDetails(false);
                  setSelectedUser(null);
                }}
                className="macos-button px-4 py-2 text-gray-400 hover:text-white transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Access Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass p-6 w-full max-w-md rounded-xl border border-hologram-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="mr-3 text-xl">🚫</span>Revoke Access
              </h3>
              <button
                onClick={() => {
                  setShowRevokeModal(false);
                  setActionMessage('');
                  setSelectedUser(null);
                }}
                className="macos-button p-2 text-gray-400 hover:text-white transition-all duration-200"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>
            <p className="text-gray-400 mb-4">
              Are you sure you want to revoke access for <strong className="text-white">{selectedUser?.username}</strong>?
              This will also remove their bot permissions from all guilds.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">
                Reason for revocation:
              </label>
              <textarea
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder="Enter reason for revoking access..."
                className="w-full px-4 py-3 glass border border-hologram-500/30 rounded-xl text-white placeholder-gray-400 focus:glass-strong focus:border-red-500 transition-all duration-200"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRevokeModal(false);
                  setActionMessage('');
                  setSelectedUser(null);
                }}
                className="macos-button px-4 py-2 text-gray-400 hover:text-white transition-all duration-200"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeAccess}
                disabled={actionLoading || !actionMessage.trim()}
                className="macos-button px-4 py-2 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {actionLoading ? 'Revoking...' : 'Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Access Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass p-6 w-full max-w-md rounded-xl border border-hologram-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="mr-3 text-xl">✅</span>Grant Access
              </h3>
              <button
                onClick={() => {
                  setShowGrantModal(false);
                  setActionMessage('');
                  setSelectedUser(null);
                }}
                className="macos-button p-2 text-gray-400 hover:text-white transition-all duration-200"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>
            <p className="text-gray-400 mb-4">
              Grant access to <strong className="text-white">{selectedUser?.username}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">
                Welcome message (optional):
              </label>
              <textarea
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder="Enter a welcome message..."
                className="w-full px-4 py-3 glass border border-hologram-500/30 rounded-xl text-white placeholder-gray-400 focus:glass-strong focus:border-green-500 transition-all duration-200"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowGrantModal(false);
                  setActionMessage('');
                  setSelectedUser(null);
                }}
                className="macos-button px-4 py-2 text-gray-400 hover:text-white transition-all duration-200"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleGrantAccess}
                disabled={actionLoading}
                className="macos-button px-4 py-2 text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {actionLoading ? 'Granting...' : 'Grant Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementPanel;
