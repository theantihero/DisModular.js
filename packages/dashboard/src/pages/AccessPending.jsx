/* eslint-env browser, node */
/**
 * Access Pending Page
 * Shows access request status and allows users to request access
 * @author fkndean_
 * @date 2025-10-18
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAppStore } from '../viewmodels/AppViewModel';
import { useTheme } from '../hooks/useTheme';
import { _SpaceBackground } from '../components/SpaceBackground';

export function AccessPending() {
  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAppStore();
  const { theme } = useTheme();
  const [accessStatus, setAccessStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [_isCelebrating, _setIsCelebrating] = useState(false);

  useEffect(() => {
    fetchAccessStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAccessStatus = async () => {
    try {
      const response = await api.auth.getAccessStatus();
      const accessData = response?.data || {};
      setAccessStatus(accessData);
      
      // If access is approved, show celebration and redirect
      if (accessData.access_status === 'approved') {
        _setIsCelebrating(true);
        setTimeout(async () => {
          try {
            await checkAuth();
            navigate('/dashboard', { replace: true });
          } catch (error) {
            console.error('Failed to redirect to dashboard:', error);
          }
        }, 3000); // Show celebration for 3 seconds
      }
    } catch (error) {
      console.error('Failed to fetch access status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!requestMessage.trim()) {
      // eslint-disable-next-line no-undef
      alert('Please enter a message explaining why you want access to the platform');
      return;
    }

    setRequesting(true);
    try {
      await api.auth.requestAccess({ message: requestMessage });
      await fetchAccessStatus();
      setRequestMessage('');
    } catch (error) {
      console.error('Failed to request access:', error);
      // eslint-disable-next-line no-undef
      alert('Failed to submit access request. Please try again.');
    } finally {
      setRequesting(false);
    }
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className={getBackgroundClass()}>
        {theme === 'space' && <SpaceBackground />}
        <div className="text-center relative z-10">
          <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
            theme === 'space' ? 'border-hologram-500' : 'border-blue-500'
          }`}></div>
          <p className={`text-lg ${theme === 'space' ? 'text-white' : theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            Loading access status...
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!accessStatus) {
      return (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Status Unknown</h1>
          <p className="text-gray-300 mb-6">Unable to determine your access status. Please try again later.</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      );
    }

    switch (accessStatus.access_status) {
      case 'pending':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Access Request Pending</h1>
            <p className="text-gray-300 mb-6">
              Your access request is currently being reviewed by an administrator. 
              You will be notified once a decision has been made.
            </p>
            {accessStatus.access_requested_at && (
              <p className="text-sm text-gray-400 mb-6">
                Request submitted: {new Date(accessStatus.access_requested_at).toLocaleString()}
              </p>
            )}
            {accessStatus.access_request_message && (
              <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <h3 className="text-blue-400 font-semibold mb-2">Your Request Message:</h3>
                <p className="text-gray-300 text-sm">{accessStatus.access_request_message}</p>
              </div>
            )}
            <div className="space-x-4">
              <button
                onClick={fetchAccessStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Refresh Status
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        );

      case 'denied':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Platform Access Denied</h1>
            <p className="text-gray-300 mb-6">
              You need to be whitelisted to use this platform.
            </p>
            {accessStatus.access_message && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <h3 className="text-red-400 font-semibold mb-2">Reason:</h3>
                <p className="text-gray-300 text-sm">{accessStatus.access_message}</p>
              </div>
            )}
            <div className="max-w-md mx-auto mb-6">
              <label htmlFor="requestMessage" className="block text-sm font-medium text-gray-300 mb-2">
                Why do you want access to this platform?
              </label>
              <textarea
                id="requestMessage"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Please explain why you need access to this platform..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">
                {requestMessage.length}/500 characters
              </p>
            </div>
            <div className="space-x-4">
              <button
                onClick={handleRequestAccess}
                disabled={requesting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {requesting ? 'Requesting...' : 'Request Access Again'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        );

      case 'approved':
        return (
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce ${
              theme === 'space' ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-green-500'
            }`}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className={`text-3xl font-bold mb-4 ${
              theme === 'space' ? 'text-white' : theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              🎉 Access Approved! 🎉
            </h1>
            <p className={`text-lg mb-6 ${
              theme === 'space' ? 'text-gray-300' : theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Welcome to the platform! Redirecting to dashboard...
            </p>
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className={`px-6 py-3 rounded-lg transition-all hover:scale-105 ${
                theme === 'space' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-semibold' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Go to Dashboard
            </button>
          </div>
        );

      case null:
      case undefined:
        return (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Status Not Set</h1>
            <p className="text-gray-300 mb-6">
              Your access status has not been set yet. Please request access to the platform.
            </p>
            <div className="max-w-md mx-auto mb-6">
              <label htmlFor="requestMessage" className="block text-sm font-medium text-gray-300 mb-2">
                Why do you want access to this platform?
              </label>
              <textarea
                id="requestMessage"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Please explain why you need access to this platform..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">
                {requestMessage.length}/500 characters
              </p>
            </div>
            <div className="space-x-4">
              <button
                onClick={handleRequestAccess}
                disabled={requesting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {requesting ? 'Requesting...' : 'Request Access'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Unknown Access Status</h1>
            <p className="text-gray-300 mb-6">
              Your access status is unclear. Please contact an administrator.
            </p>
            <button
              onClick={handleLogout}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        );
    }
  };

  return (
    <div className={getBackgroundClass()}>
      {theme === 'space' && <SpaceBackground />}
      <div className="max-w-md w-full mx-4 relative z-10">
        <div className={`rounded-lg p-8 shadow-xl ${
          theme === 'space' 
            ? 'bg-gray-900/80 backdrop-blur-lg border border-gray-700/50' 
            : theme === 'light'
            ? 'bg-white/90 backdrop-blur-lg border border-gray-200/50'
            : 'bg-gray-800'
        }`}>
          {renderContent()}
        </div>
        
        {/* User info */}
        {user && (
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Logged in as <span className="text-white font-semibold">{user?.data?.username || 'User'}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccessPending;
