/**
 * ThemeContext Tests
 * Tests for theme switching and localStorage persistence
 * @author fkndean_
 * @date 2025-10-18
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, ThemeContext } from '../src/contexts/ThemeContext';
import { useContext } from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Test component that uses theme context
function TestComponent() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={toggleTheme} data-testid="toggle-button">
        Toggle Theme
      </button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('should default to space theme when no preference is stored', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('space');
    expect(document.documentElement.classList.contains('space')).toBe(true);
  });

  it('should load space theme from localStorage', () => {
    localStorage.setItem('dismodular-theme', 'space');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('space');
    expect(document.documentElement.classList.contains('space')).toBe(true);
  });

  it('should always use space theme regardless of toggle', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeDisplay = screen.getByTestId('current-theme');
    const toggleButton = screen.getByTestId('toggle-button');

    // Should start with space theme
    expect(themeDisplay.textContent).toBe('space');

    // Toggle should still result in space theme
    fireEvent.click(toggleButton);
    expect(themeDisplay.textContent).toBe('space');

    // Multiple toggles should still result in space theme
    fireEvent.click(toggleButton);
    expect(themeDisplay.textContent).toBe('space');
  });

  it('should persist space theme to localStorage on change', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-button');

    // Should start with space theme
    expect(localStorage.getItem('dismodular-theme')).toBe('space');

    fireEvent.click(toggleButton);
    expect(localStorage.getItem('dismodular-theme')).toBe('space');

    fireEvent.click(toggleButton);
    expect(localStorage.getItem('dismodular-theme')).toBe('space');
  });

  it('should update document class to space theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should always use space theme
    expect(document.documentElement.classList.contains('space')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('should handle space theme from localStorage', () => {
    localStorage.setItem('dismodular-theme', 'space');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('space');
    expect(document.documentElement.classList.contains('space')).toBe(true);
  });
});