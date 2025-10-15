/**
 * Admin Panel Component
 * Modern admin management interface
 * @author fkndean_
 * @date 2025-10-14
 */

import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import api from '../services/api';

export function AdminPanel({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminDiscordId, setNewAdminDiscordId] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.admin.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('❌ Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId, currentStatus) => {
    try {
      await api.admin.toggleAdmin(userId, !currentStatus, `Admin status ${!currentStatus ? 'granted' : 'revoked'}`);
      
      setUsers(users.map(user => 
        user.discord_id === userId 
          ? { ...user, is_admin: !currentStatus }
          : user
      ));
      
      toast.success(`✅ Admin status ${!currentStatus ? 'granted' : 'revoked'} successfully`);
    } catch (error) {
      console.error('Failed to toggle admin:', error);
      toast.error('❌ Failed to update admin status');
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminDiscordId.trim()) {
      toast.error('❌ Please enter a Discord ID');
      return;
    }

    try {
      await api.admin.addAdmin(newAdminDiscordId, 'Admin privileges granted via dashboard');
      
      toast.success(`✅ Admin privileges granted to ${newAdminDiscordId}`);
      setNewAdminDiscordId('');
      setShowAddAdmin(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to add admin:', error);
      toast.error('❌ Failed to add admin');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.discord_id.includes(searchTerm)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-2xl font-bold flex items-center">
                <span className="mr-2">👑</span> Admin Management
              </h2>
              <p className="text-gray-400 text-sm mt-1">Manage user permissions and admin access</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-gray-400 text-xl">✕</span>
            </button>
          </div>
        </div>

        {/* Search and Add */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search users by name or Discord ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowAddAdmin(!showAddAdmin)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
            >
              ➕ Add Admin
            </button>
          </div>

          {/* Add Admin Form */}
          {showAddAdmin && (
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <h3 className="text-white font-medium mb-3">Grant Admin Access</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Discord User ID (e.g., 123456789012345678)"
                  value={newAdminDiscordId}
                  onChange={(e) => setNewAdminDiscordId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddAdmin}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  ✅ Grant Access
                </button>
                <button
                  onClick={() => setShowAddAdmin(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-gray-400 text-xs mt-2">
                💡 To get a Discord User ID: Enable Developer Mode → Right-click user → Copy ID
              </p>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">👥</span>
              <h3 className="text-white text-lg font-medium mb-2">No users found</h3>
              <p className="text-gray-400">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-gray-700/30 hover:bg-gray-700/50 rounded-lg p-4 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png` : '/default-avatar.png'}
                        alt={user.username}
                        className="w-12 h-12 rounded-full"
                        onError={(e) => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiM2MzY2RjEiLz4KPHN2Zz4K'; }}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-white font-medium">{user.username}</h3>
                          <span className="text-gray-400 text-sm">#{user.discriminator}</span>
                          {user.is_admin && (
                            <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs rounded-full font-medium">
                              👑 Admin
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">ID: {user.discord_id}</p>
                        <p className="text-gray-500 text-xs">
                          Last login: {new Date(user.last_login).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-gray-400 text-xs">Joined</p>
                        <p className="text-white text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                      
                      <button
                        onClick={() => handleToggleAdmin(user.discord_id, user.is_admin)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          user.is_admin
                            ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
                            : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                        }`}
                      >
                        {user.is_admin ? '🔴 Revoke Admin' : '🟢 Grant Admin'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              <span className="mr-4">👥 {users.length} total users</span>
              <span>👑 {users.filter(u => u.is_admin).length} admins</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
