/**
 * Access Denied Page
 * Shown when non-admin users try to access admin-only pages
 * @author fkndean_
 * @date 2025-10-14
 */

import { useAppStore } from '../viewmodels/AppViewModel';

/**
 * AccessDenied Component
 */
export function AccessDenied() {
  const { user, logout } = useAppStore();

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
            Access Denied
          </h1>
          <p className="text-gray-400 text-lg">
            Admin Privileges Required
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              You don't have permission to access the dashboard. This area is restricted to administrators only.
            </p>
            {user && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-gray-400 text-sm mb-1">Logged in as:</p>
                <p className="text-white font-semibold">{user.username}#{user.discriminator}</p>
              </div>
            )}
            <p className="text-gray-400 text-sm">
              If you believe this is an error, please contact the bot administrator to grant you access.
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>

        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Discord Bot Modular Platform | Version 0.0.1</p>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;

