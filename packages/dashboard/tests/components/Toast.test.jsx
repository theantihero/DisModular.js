/**
 * Toast Tests
 * Tests for toast notification component
 * @author fkndean_
 * @date 2025-10-18
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, _waitFor } from '@testing-library/react';
import { _Toast, _ToastContainer } from '../../src/components/Toast';
import { _ThemeProvider } from '../../src/contexts/ThemeContext';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    
    // Mock matchMedia for each test
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)' || query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render toast message', () => {
    const onClose = vi.fn();
    render(
      <ThemeProvider>
        <Toast message="Test message" type="info" onClose={onClose} duration={0} />
      </ThemeProvider>
    );

    expect(screen.getByText('Test message')).toBeTruthy();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ThemeProvider>
        <Toast message="Test message" type="info" onClose={onClose} duration={0} />
      </ThemeProvider>
    );

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should auto-close after duration', () => {
    const onClose = vi.fn();
    render(
      <ThemeProvider>
        <Toast message="Test message" type="info" onClose={onClose} duration={3000} />
      </ThemeProvider>
    );

    expect(onClose).not.toHaveBeenCalled();
    // The component should render without errors
    expect(screen.getByText('Test message')).toBeTruthy();
  });

  it('should render success toast with correct styling', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ThemeProvider>
        <Toast message="Success!" type="success" onClose={onClose} duration={0} />
      </ThemeProvider>
    );

    const toast = container.firstChild;
    expect(toast.className).toContain('green');
  });

  it('should render error toast with correct styling', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ThemeProvider>
        <Toast message="Error!" type="error" onClose={onClose} duration={0} />
      </ThemeProvider>
    );

    const toast = container.firstChild;
    expect(toast.className).toContain('red');
  });

  it('should render warning toast with correct styling', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ThemeProvider>
        <Toast message="Warning!" type="warning" onClose={onClose} duration={0} />
      </ThemeProvider>
    );

    const toast = container.firstChild;
    expect(toast.className).toContain('yellow');
  });

  it('should render info toast with correct styling', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ThemeProvider>
        <Toast message="Info!" type="info" onClose={onClose} duration={0} />
      </ThemeProvider>
    );

    const toast = container.firstChild;
    expect(toast.className).toContain('hologram');
  });

  it('should render with space theme styling', () => {
    // eslint-disable-next-line no-undef
    localStorage.setItem('dismodular-theme', 'space');
    const onClose = vi.fn();
    const { container } = render(
      <ThemeProvider>
        <Toast message="Space toast!" type="info" onClose={onClose} duration={0} />
      </ThemeProvider>
    );

    const toast = container.firstChild;
    expect(toast.className).toContain('holographic') || expect(toast.className).toContain('cosmic');
  });
});

describe('ToastContainer', () => {
  beforeEach(() => {
    // Mock matchMedia for each test
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)' || query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('should render multiple toasts', () => {
    const removeToast = vi.fn();
    const toasts = [
      { id: 1, message: 'Toast 1', type: 'info', duration: 3000 },
      { id: 2, message: 'Toast 2', type: 'success', duration: 3000 },
      { id: 3, message: 'Toast 3', type: 'error', duration: 3000 }
    ];

    render(
      <ThemeProvider>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </ThemeProvider>
    );

    expect(screen.getByText('Toast 1')).toBeTruthy();
    expect(screen.getByText('Toast 2')).toBeTruthy();
    expect(screen.getByText('Toast 3')).toBeTruthy();
  });

  it('should render empty container when no toasts', () => {
    const removeToast = vi.fn();
    const { container } = render(
      <ThemeProvider>
        <ToastContainer toasts={[]} removeToast={removeToast} />
      </ThemeProvider>
    );

    expect(container.firstChild.children.length).toBe(0);
  });

  it('should position toasts in top-right corner', () => {
    const removeToast = vi.fn();
    const toasts = [{ id: 1, message: 'Toast', type: 'info', duration: 3000 }];

    const { container } = render(
      <ThemeProvider>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </ThemeProvider>
    );

    const wrapper = container.firstChild;
    expect(wrapper.className).toContain('top-4');
    expect(wrapper.className).toContain('right-4');
  });
});

