/**
 * Access Denied Page
 * Shown when users don't have proper access to the platform
 * @author fkndean_
 * @date 2025-01-27
 */

import { useState } from 'react';
import { useAppStore } from '../viewmodels/AppViewModel';
import { api } from '../services/api';

/**
 * AccessDenied Component
 */
export function AccessDenied() {
  const { user, logout } = useAppStore();
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Determine the appropriate message based on access status
  const getAccessMessage = () => {
    if (user?.data?.access_status === 'denied') {
      return {
        title: 'Access Request Denied',
        subtitle: 'Your access request has been denied',
        message: user.data.access_message || 'Your access request has been denied by an administrator.',
        showReason: true
      };
    }
    
    return {
      title: 'Platform Access Denied',
      subtitle: 'You need to be whitelisted to use this platform.',
      message: 'You don\'t have permission to access the dashboard. This area is restricted to administrators only.',
      showReason: false
    };
  };

  const accessInfo = getAccessMessage();

  /**
   * Handle access request submission
   */
  const handleRequestAccess = async () => {
    if (!requestMessage.trim()) {
      setSubmitError('Please explain why you need access to this platform.');
      return;
    }

    if (requestMessage.length > 500) {
      setSubmitError('Message must be 500 characters or less.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await api.auth.requestAccess({ message: requestMessage.trim() });
      setSubmitSuccess(true);
      setRequestMessage('');
    } catch (error) {
      console.error('Failed to submit access request:', error);
      setSubmitError(error.error || 'Failed to submit access request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-red-600 rounded-full mb-4">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {accessInfo.title}
          </h1>
          <p className="text-gray-400 text-lg">
            {accessInfo.subtitle}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              {accessInfo.message}
            </p>
            
            {accessInfo.showReason && user?.data?.access_message && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
                <h3 className="text-red-400 font-semibold mb-2">Reason:</h3>
                <p className="text-gray-300 text-sm">{user.data.access_message}</p>
              </div>
            )}
            
            {user && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-gray-400 text-sm mb-1">Logged in as:</p>
                <p className="text-white font-semibold">{user?.data?.username || 'User'}#{user?.data?.discriminator || '0000'}</p>
              </div>
            )}
            
            <p className="text-gray-400 text-sm mb-6">
              {user?.data?.access_status === 'denied' 
                ? 'If you believe this is an error, you can request access again or contact the bot administrator.'
                : 'If you believe this is an error, please contact the bot administrator to grant you access.'
              }
            </p>

            {/* Success Message */}
            {submitSuccess && (
              <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-green-400 font-medium">Access request submitted successfully!</p>
                </div>
                <p className="text-gray-300 text-sm mt-1">An administrator will review your request and respond soon.</p>
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-400 font-medium">Error</p>
                </div>
                <p className="text-gray-300 text-sm mt-1">{submitError}</p>
              </div>
            )}

            {/* Access Request Form */}
            {!submitSuccess && user?.data?.access_status !== 'pending' && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-300 font-medium mb-2">
                    Why do you want access to this platform?
                  </label>
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Please explain why you need access to this platform..."
                    className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    maxLength={500}
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-400">
                      {requestMessage.length}/500 characters
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Pending Request Message */}
            {user?.data?.access_status === 'pending' && (
              <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-blue-400 font-medium">Access Request Pending</p>
                </div>
                <p className="text-gray-300 text-sm mt-1">Your access request is being reviewed by an administrator. You will be notified once a decision is made.</p>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            {!submitSuccess && user?.data?.access_status !== 'pending' ? (
              <>
                <button
                  onClick={handleRequestAccess}
                  disabled={isSubmitting || !requestMessage.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Request Access'
                  )}
                </button>
                <button
                  onClick={logout}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={logout}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Discord Bot Modular Platform | Version 0.0.1</p>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;

