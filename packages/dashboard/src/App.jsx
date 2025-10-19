/**
 * Main App Component
 * Handles routing and authentication
 * @author fkndean_
 * @date 2025-10-14
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useAppStore } from './viewmodels/AppViewModel';
import SpaceBackground from './components/SpaceBackground';
import HUDOverlay from './components/HUDOverlay';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PluginEditor from './pages/PluginEditor';
import AuthCallback from './pages/AuthCallback';
import AccessDenied from './pages/AccessDenied';
import AccessPending from './pages/AccessPending';
import MobileNav from './components/MobileNav';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

/**
 * Protected Route Component
 * Requires authentication and approved access
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, user } = useAppStore();
  
  // ProtectedRoute debug info
  
  if (!isAuthenticated) {
    // Redirecting to login - not authenticated
    return <Navigate to="/login" replace />;
  }
  
  // Admins always have access - return early to avoid access status checks
  if (isAdmin) {
    // Admin access granted
    return children;
  }
  
  // Check access status for non-admins only
  if (user?.data?.access_status === 'pending' || user?.data?.access_status === 'denied') {
    // Redirecting to access-pending
    return <Navigate to="/access-pending" replace />;
  }
  
  if (user?.data?.access_status !== 'approved') {
    // Redirecting to access-denied
    return <Navigate to="/access-denied" replace />;
  }
  
  // Access granted
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, user } = useAppStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has platform access first
  if (user?.access_status === 'pending' || user?.access_status === 'denied') {
    return <Navigate to="/access-pending" replace />;
  }
  
  if (user?.access_status !== 'approved') {
    return <Navigate to="/access-denied" replace />;
  }
  
  // Then check admin privileges
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Admin Privileges Required</h1>
          <p className="text-gray-300 mb-6">
            This feature requires administrator privileges. Please contact an admin if you need access.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return children;
}

/**
 * Space Theme Wrapper Component
 */
function SpaceThemeWrapper({ children }) {
  const { theme } = useTheme();
  
  return (
    <div className="relative min-h-screen">
      {theme === 'space' && <SpaceBackground />}
      {theme === 'space' && <HUDOverlay />}
      <div className={`relative z-20 ${theme === 'space' ? 'space' : ''}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * App Component
 */
function App() {
  const { checkAuth, isAuthenticated } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await checkAuth();
    setLoading(false);
  };

  if (loading) {
    return (
      <ThemeProvider>
        <SpaceThemeWrapper>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h1 className="text-white text-2xl font-bold mb-2">Discord Bot Admin</h1>
              <p className="text-gray-400 text-lg">Initializing dashboard...</p>
              <div className="mt-4 flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </SpaceThemeWrapper>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SpaceThemeWrapper>
            {/* Mobile Navigation */}
            {isAuthenticated && <MobileNav />}
          
            <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          
          <Route 
            path="/auth/callback" 
            element={<AuthCallback />} 
          />
          
          <Route 
            path="/access-pending" 
            element={isAuthenticated ? <AccessPending /> : <Navigate to="/login" replace />} 
          />
          
          <Route 
            path="/access-denied" 
            element={isAuthenticated ? <AccessDenied /> : <Navigate to="/login" replace />} 
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/plugins/new"
            element={
              <ProtectedRoute>
                <PluginEditor />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/plugins/:id/edit"
            element={
              <ProtectedRoute>
                <PluginEditor />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
          />
          
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
            </Routes>
          </SpaceThemeWrapper>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

