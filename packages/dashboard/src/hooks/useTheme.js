/**
 * useTheme Hook
 * Custom hook for consuming theme context
 * @author fkndean_
 * @date 2025-10-15
 */

import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

/**
 * Hook to access theme state and controls
 * @returns {Object} - { theme, toggleTheme }
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

export default useTheme;

