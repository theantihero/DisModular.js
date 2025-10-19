/**
 * HeartbeatIcon Test
 * @author fkndean_
 * @date 2025-01-27
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HeartbeatIcon from '../../src/components/HeartbeatIcon';

describe('HeartbeatIcon', () => {
  it('renders online heartbeat icon', () => {
    const { container } = render(<HeartbeatIcon status="online" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('animate-heartbeat');
  });

  it('renders offline heartbeat icon', () => {
    const { container } = render(<HeartbeatIcon status="offline" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('text-red-400');
  });

  it('renders connecting heartbeat icon', () => {
    const { container } = render(<HeartbeatIcon status="connecting" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('animate-heartbeat-slow');
  });

  it('applies correct size classes', () => {
    const { container } = render(<HeartbeatIcon status="online" size="lg" />);
    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('w-6', 'h-6');
  });
});
