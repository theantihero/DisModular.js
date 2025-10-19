/**
 * HeartbeatIcon Test
 * @author fkndean_
 * @date 2025-01-27
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import _HeartbeatIcon from '../components/HeartbeatIcon';

describe('HeartbeatIcon', () => {
  it('renders online heartbeat icon', () => {
    render(<HeartbeatIcon status="online" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('animate-heartbeat');
  });

  it('renders offline heartbeat icon', () => {
    render(<HeartbeatIcon status="offline" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('text-red-400');
  });

  it('renders connecting heartbeat icon', () => {
    render(<HeartbeatIcon status="connecting" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('animate-heartbeat-slow');
  });

  it('applies correct size classes', () => {
    render(<HeartbeatIcon status="online" size="lg" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('w-6', 'h-6');
  });
});
