/* eslint-env browser, node */
/**
 * Theme Context
 * Manages light/dark/space theme state with localStorage persistence
 * @author fkndean_
 * @date 2025-01-18
 */

import { createContext, useState, useEffect, useContext } from 'react';

export const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'dismodular-theme';

/**
 * ThemeProvider Component
 * Provides theme state and toggle function to the app
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('space'); // Always use space theme

  // Update localStorage and document class when theme changes
  useEffect(() => {
    // eslint-disable-next-line no-undef
    localStorage.setItem(THEME_STORAGE_KEY, 'space');
    
    // Update document class for global theme styling
    document.documentElement.classList.remove('light', 'dark', 'space');
    document.documentElement.classList.add('space');
  }, []);

  const toggleTheme = () => {
    // No-op since we only have space theme
    setTheme('space');
  };

  const setThemeDirect = (_newTheme) => {
    // Always set to space theme regardless of input
    setTheme('space');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeDirect }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme Hook
 * Custom hook to access theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeProvider;

