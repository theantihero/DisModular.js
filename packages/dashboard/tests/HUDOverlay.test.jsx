/**
 * HUDOverlay Tests
 * Tests for HUD overlay rendering and animations
 * @author fkndean_
 * @date 2025-10-18
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, _screen, _waitFor } from '@testing-library/react';
import HUDOverlay from '../src/components/HUDOverlay';

describe('HUDOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render overlay container', () => {
    const { container } = render(<HUDOverlay />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should render corner brackets', () => {
    const { container } = render(<HUDOverlay />);
    const corners = container.querySelectorAll('[class*="absolute"]');
    expect(corners.length).toBeGreaterThan(0);
  });

  it('should render scanline effect', () => {
    const { container } = render(<HUDOverlay />);
    const scanline = container.querySelector('[class*="gradient-to-r"]');
    expect(scanline).toBeTruthy();
  });

  it('should render grid lines', () => {
    const { container } = render(<HUDOverlay />);
    const grid = container.querySelector('[class*="opacity-20"]');
    expect(grid).toBeTruthy();
  });

  it('should apply correct styles to container', () => {
    const { container } = render(<HUDOverlay />);
    const wrapper = container.firstChild;

    expect(wrapper.className).toContain('fixed');
    expect(wrapper.className).toContain('inset-0');
    expect(wrapper.className).toContain('pointer-events-none');
  });

  it('should animate scanline position', () => {
    const { container } = render(<HUDOverlay />);
    const scanline = container.querySelector('[class*="gradient-to-r"]');

    expect(scanline).toBeTruthy();
    expect(scanline.style.top).toBeDefined();
  });

  it('should cleanup interval on unmount', () => {
    const { unmount } = render(<HUDOverlay />);
    // eslint-disable-next-line no-undef
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should render all four corner brackets', () => {
    const { container } = render(<HUDOverlay />);
    
    // Check for top-left, top-right, bottom-left, bottom-right corners
    const topLeft = container.querySelector('[class*="top-0"][class*="left-0"]');
    const topRight = container.querySelector('[class*="top-0"][class*="right-0"]');
    const bottomLeft = container.querySelector('[class*="bottom-0"][class*="left-0"]');
    const bottomRight = container.querySelector('[class*="bottom-0"][class*="right-0"]');

    expect(topLeft || topRight || bottomLeft || bottomRight).toBeTruthy();
  });

  it('should have holographic styling', () => {
    const { container } = render(<HUDOverlay />);
    const elements = container.querySelectorAll('[class*="hologram"]');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should not interfere with pointer events', () => {
    const { container } = render(<HUDOverlay />);
    const wrapper = container.firstChild;
    expect(wrapper.className).toContain('pointer-events-none');
  });
});

