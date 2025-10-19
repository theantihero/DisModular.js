/* eslint-env browser, node */
/**
 * Access Requests Panel
 * Admin component for managing user access requests
 * @author fkndean_
 * @date 2025-10-18
 */

import { useState, useEffect } from 'react';
import api from '../services/api';

export function AccessRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [denyMessage, setDenyMessage] = useState('');
  const [approveMessage, setApproveMessage] = useState('Welcome to the platform!');
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getAccessRequests();
      const requestsData = response?.data || [];
      setRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (error) {
      console.error('Failed to fetch access requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    setActionLoading(true);
    try {
      await api.admin.approveAccess(userId, approveMessage);
      await fetchRequests();
      setShowApproveModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to approve access:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeny = async (userId) => {
    if (!denyMessage.trim()) {
      // eslint-disable-next-line no-undef
      alert('Please provide a reason for denial');
      return;
    }

    setActionLoading(true);
    try {
      await api.admin.denyAccess(userId, denyMessage);
      await fetchRequests();
      setShowDenyModal(false);
      setSelectedUser(null);
      setDenyMessage('');
    } catch (error) {
      console.error('Failed to deny access:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openDenyModal = (user) => {
    setSelectedUser(user);
    setDenyMessage('');
    setShowDenyModal(true);
  };

  const openApproveModal = (user) => {
    setSelectedUser(user);
    setApproveMessage('Welcome to the platform!');
    setShowApproveModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getAvatarUrl = (user) => {
    if (user.avatar) {
      return `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png?size=64`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Access Requests</h2>
        <button
          onClick={fetchRequests}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Pending Requests</h3>
          <p className="text-gray-400">All access requests have been processed.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(requests || []).map((user) => (
            <div key={user.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-4">
                <img
                  src={getAvatarUrl(user)}
                  alt={user.username}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-white">{user.username}</h3>
                    <span className="text-gray-400">#{user.discriminator}</span>
                  </div>
                  <p className="text-sm text-gray-400">Discord ID: {user.discord_id}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                    <span>Joined: {formatDate(user.created_at)}</span>
                    <span>Last Login: {formatDate(user.last_login)}</span>
                    {user.access_requested_at && (
                      <span>Requested: {formatDate(user.access_requested_at)}</span>
                    )}
                  </div>
                  {user.access_request_message && (
                    <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-300 mb-1">Request Message:</h4>
                      <p className="text-sm text-gray-400">{user.access_request_message}</p>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openApproveModal(user)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => openDenyModal(user)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Deny
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Approve Access for {selectedUser.username}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Welcome Message (Optional)
                </label>
                <textarea
                  value={approveMessage}
                  onChange={(e) => setApproveMessage(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Welcome to the platform!"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleApprove(selectedUser.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {actionLoading ? 'Approving...' : 'Approve Access'}
                </button>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deny Modal */}
      {showDenyModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Deny Access for {selectedUser.username}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason for Denial <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={denyMessage}
                  onChange={(e) => setDenyMessage(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Please provide a reason for denying access..."
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleDeny(selectedUser.id)}
                  disabled={actionLoading || !denyMessage.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {actionLoading ? 'Denying...' : 'Deny Access'}
                </button>
                <button
                  onClick={() => setShowDenyModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccessRequestsPanel;
