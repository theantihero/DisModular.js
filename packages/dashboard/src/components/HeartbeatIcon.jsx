/**
 * HeartbeatIcon Component
 * Animated heartbeat icon for status indicators
 * @author fkndean_
 * @date 2025-01-27
 */

import _React from 'react';

/**
 * HeartbeatIcon - Animated heartbeat icon component
 * @param {Object} props - Component props
 * @param {string} props.status - Status: 'online', 'offline', 'connecting'
 * @param {string} props.size - Size: 'sm', 'md', 'lg'
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} HeartbeatIcon component
 */
export function HeartbeatIcon({ status = 'offline', size = 'md', className = '' }) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'lg': return 'w-6 h-6';
      default: return 'w-4 h-4';
    }
  };

  const getStatusClasses = () => {
    switch (status) {
      case 'online':
        return 'text-green-400 animate-heartbeat';
      case 'offline':
        return 'text-red-400';
      case 'connecting':
        return 'text-yellow-400 animate-heartbeat-slow';
      default:
        return 'text-gray-400';
    }
  };

  const getHeartIcon = () => {
    switch (status) {
      case 'online':
        return (
          <svg 
            className={`${getSizeClasses()} ${getStatusClasses()} ${className}`}
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        );
      case 'offline':
        return (
          <svg 
            className={`${getSizeClasses()} ${getStatusClasses()} ${className}`}
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        );
      case 'connecting':
        return (
          <svg 
            className={`${getSizeClasses()} ${getStatusClasses()} ${className}`}
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        );
      default:
        return (
          <svg 
            className={`${getSizeClasses()} ${getStatusClasses()} ${className}`}
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        );
    }
  };

  return getHeartIcon();
}

export default HeartbeatIcon;
