/**
 * Main App Component
 * Handles routing and authentication
 * @author fkndean_
 * @date 2025-10-14
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAppStore } from './viewmodels/AppViewModel';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PluginEditor from './pages/PluginEditor';
import AuthCallback from './pages/AuthCallback';
import AccessDenied from './pages/AccessDenied';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
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
 * Requires authentication and admin privileges
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAppStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/access-denied" replace />;
  }
  
  return children;
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-white text-2xl font-bold mb-2">🤖 Discord Bot Admin</h1>
          <p className="text-gray-400 text-lg">Initializing dashboard...</p>
          <div className="mt-4 flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
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
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
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
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

