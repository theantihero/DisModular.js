/**
 * Floating Guild Selector Component
 * A floating, minimizable guild selector widget for the bottom right corner
 * @author fkndean_
 * @date 2025-01-27
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../viewmodels/AppViewModel';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';
import { api } from '../services/api';

export default function FloatingGuildSelector({ selectedGuild, onGuildSelect, cachedGuildId }) {
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: window.innerHeight - 200 });
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0, hasMoved: false, isDragging: false });
  
  const { refreshGuilds, refreshCooldown, getCooldownTime } = useAppStore();
  const { theme } = useTheme();
  const toast = useToast();
  
  // Helper function to get guild icon
  const getGuildIcon = (guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
    }
    return null;
  };

  // Helper function to get guild initials
  const getGuildInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    fetchGuilds();
    // Initialize position - responsive for mobile
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // On mobile, position at bottom center with proper spacing
      setPosition({ 
        x: Math.max(16, (window.innerWidth - 280) / 2), 
        y: window.innerHeight - 120 
      });
    } else {
      // On desktop, position at bottom right
      setPosition({ x: window.innerWidth - 320, y: window.innerHeight - 200 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle window resize to keep widget in bounds and close dropdown
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setPosition(prev => {
        if (isMobile) {
          // On mobile, center horizontally and keep at bottom
          return {
            x: Math.max(16, (window.innerWidth - 280) / 2),
            y: Math.min(prev.y, window.innerHeight - 120)
          };
        } else {
          // On desktop, keep in bounds
          return {
            x: Math.min(prev.x, window.innerWidth - 320),
            y: Math.min(prev.y, window.innerHeight - 200)
          };
        }
      });
      
      // Close dropdown on resize to prevent positioning issues
      if (dropdownOpen) {
        setDropdownOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dropdownOpen]);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate optimal position
      let top = rect.bottom + window.scrollY + 8; // Default: below the widget
      let left = rect.left + window.scrollX;
      
      // Check if dropdown would go off-screen vertically
      const dropdownHeight = 200; // Approximate dropdown height
      if (top + dropdownHeight > viewportHeight + window.scrollY) {
        // Position above the widget instead
        top = rect.top + window.scrollY - dropdownHeight - 8;
      }
      
      // Check if dropdown would go off-screen horizontally
      const dropdownWidth = Math.max(280, rect.width);
      if (left + dropdownWidth > viewportWidth) {
        // Align to the right edge of the widget
        left = rect.right + window.scrollX - dropdownWidth;
      }
      
      // Ensure dropdown doesn't go off the left edge
      if (left < window.scrollX) {
        left = window.scrollX + 8;
      }
      
      setDropdownPosition({
        top: Math.max(window.scrollY + 8, top),
        left: left,
        width: dropdownWidth
      });
    }
  }, [dropdownOpen, position, isMinimized]);

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isButtonClick = buttonRef.current?.contains(event.target);
      const isDropdownClick = event.target.closest('[data-dropdown-portal]');
      
      if (!isButtonClick && !isDropdownClick) {
        setDropdownOpen(false);
      }
    };

    const handleScroll = () => {
      // Close dropdown when scrolling to prevent it from being in wrong position
      if (dropdownOpen) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [dropdownOpen]);

  const fetchGuilds = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await api.auth.getGuilds();
      
      if (data.success) {
        setGuilds(data.data || []);
        
        // Auto-select cached guild if available
        if (cachedGuildId && !selectedGuild) {
          const cachedGuild = data.data?.find(guild => guild.id === cachedGuildId);
          if (cachedGuild) {
            onGuildSelect(cachedGuild);
          }
        }
      } else {
        throw new Error(data.error || 'Failed to fetch guilds');
      }
    } catch (error) {
      console.error('Error fetching guilds:', error);
      setError(error.message);
      toast.error(`Failed to fetch Discord servers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshCooldown > 0) {
      toast.warning(`Please wait ${getCooldownTime()} before refreshing again`);
      return;
    }

    try {
      await refreshGuilds();
      await fetchGuilds();
      toast.success('Discord servers refreshed successfully');
    } catch (error) {
      console.error('Error refreshing guilds:', error);
      toast.error('Failed to refresh Discord servers');
    }
  };

  const handleDragStart = (e) => {
    if (e.button !== 0) return; // Only handle left mouse button
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
      hasMoved: false,
      isDragging: true
    };
    
    // Prevent default to avoid text selection and improve performance
    e.preventDefault();
    e.stopPropagation();
    
    // Add global event listeners for better performance
    document.addEventListener('mousemove', handleDragMove, { passive: false });
    document.addEventListener('mouseup', handleDragEnd, { passive: false });
  };

  const handleDragMove = (e) => {
    if (!dragRef.current.isDragging) return;
    
    // Prevent default to avoid text selection
    e.preventDefault();
    
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    
    // Check if mouse has moved significantly (more than 5 pixels)
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > 5) {
      dragRef.current.hasMoved = true;
    }
    
    const isMobile = window.innerWidth < 768;
    const newPosition = {
      x: Math.max(0, Math.min(
        window.innerWidth - (isMobile ? 280 : 320), 
        dragRef.current.startPosX + deltaX
      )),
      y: Math.max(0, Math.min(
        window.innerHeight - (isMobile ? 120 : 200), 
        dragRef.current.startPosY + deltaY
      ))
    };
    
    setPosition(newPosition);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragRef.current.isDragging = false;
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // Reset hasMoved flag after a short delay to allow onClick to check it
    setTimeout(() => {
      dragRef.current.hasMoved = false;
    }, 100);
  };


  const getContainerClasses = () => {
    const isMobile = window.innerWidth < 768;
    const baseClasses = 'fixed z-50 transition-all duration-300 ease-in-out';
    const sizeClasses = isMinimized 
      ? (isMobile ? 'w-12 h-12' : 'w-16 h-16') 
      : (isMobile ? 'w-72 max-w-[calc(100vw-32px)]' : 'w-80');
    const themeClasses = theme === 'space' 
      ? 'bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 shadow-2xl'
      : theme === 'light'
      ? 'bg-white/95 backdrop-blur-lg border border-gray-200/50 shadow-2xl'
      : 'bg-gray-800/95 backdrop-blur-lg border border-gray-700/50 shadow-2xl';
    
    return `${baseClasses} ${sizeClasses} ${themeClasses}`;
  };

  const getButtonClasses = () => {
    const baseClasses = 'w-full h-full flex items-center justify-center transition-all duration-200';
    const themeClasses = theme === 'space'
      ? 'text-white hover:bg-gray-700/50'
      : theme === 'light'
      ? 'text-gray-900 hover:bg-gray-100/50'
      : 'text-white hover:bg-gray-700/50';
    
    return `${baseClasses} ${themeClasses}`;
  };

  if (loading && guilds.length === 0) {
    const isMobile = window.innerWidth < 768;
    return (
      <div 
        className={getContainerClasses()}
        style={{ 
          right: isMobile ? 'auto' : '20px', 
          bottom: '20px',
          left: isMobile ? 'auto' : 'auto',
          borderRadius: '12px'
        }}
      >
        <div className={getButtonClasses()}>
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error && guilds.length === 0) {
    const isMobile = window.innerWidth < 768;
    return (
      <div 
        className={getContainerClasses()}
        style={{ 
          right: isMobile ? 'auto' : '20px', 
          bottom: '20px',
          left: isMobile ? 'auto' : 'auto',
          borderRadius: '12px'
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Server Error
            </h3>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className={`p-1 rounded transition-colors ${
                theme === 'space' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-600/50'
              }`}
            >
              <span className="text-lg">{isMinimized ? '📖' : '📕'}</span>
            </button>
          </div>
          <p className={`text-sm mb-3 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            {error}
          </p>
          <button
            onClick={fetchGuilds}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === 'space' 
                ? 'bg-hologram-500/20 hover:bg-hologram-500/30 text-hologram-300' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Widget */}
      <div 
        className={getContainerClasses()}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          borderRadius: '12px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          zIndex: 50
        }}
      >
        {isMinimized ? (
          <div
            ref={buttonRef}
            onMouseDown={handleDragStart}
            onClick={(_e) => {
              // Only expand if not dragging and mouse hasn't moved significantly
              if (!isDragging && !dragRef.current.hasMoved) {
                setIsMinimized(false);
              }
            }}
            className={getButtonClasses()}
            title="Drag to move or click to expand"
          >
            <div className="text-center relative">
              {/* Drag Handle - 6 dots area */}
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-gray-500 text-xs cursor-grab active:cursor-grabbing select-none hover:text-gray-400 transition-colors">
                ⋮⋮
              </div>
              
              <div className="text-2xl mb-1">
                {selectedGuild ? (
                  getGuildIcon(selectedGuild) ? (
                    <img 
                      src={getGuildIcon(selectedGuild)} 
                      alt={selectedGuild.name} 
                      className="w-6 h-6 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-hologram-cyan font-semibold text-sm">
                      {getGuildInitials(selectedGuild.name)}
                    </span>
                  )
                ) : '⚙️'}
              </div>
              <div className={`text-xs font-medium ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {selectedGuild ? selectedGuild.name.substring(0, 3) : 'Select'}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {/* Header */}
            <div 
              ref={buttonRef}
              className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleDragStart}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">⋮⋮</span>
                <h3 className={`font-semibold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  {selectedGuild ? (
                    <div className="flex items-center gap-2">
                      {getGuildIcon(selectedGuild) ? (
                        <img 
                          src={getGuildIcon(selectedGuild)} 
                          alt={selectedGuild.name} 
                          className="w-5 h-5 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-hologram-cyan font-semibold text-sm">
                          {getGuildInitials(selectedGuild.name)}
                        </span>
                      )}
                      <span>{selectedGuild.name}</span>
                    </div>
                  ) : '⚙️ Select Server'}
                </h3>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDropdownOpen(!dropdownOpen);
                  }}
                  className={`p-1 rounded transition-colors ${
                    theme === 'space' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-600/50'
                  }`}
                  title="Select Server"
                >
                  <span className="text-lg">📋</span>
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshCooldown > 0}
                  className={`p-1 rounded transition-colors ${
                    refreshCooldown > 0 
                      ? 'opacity-50 cursor-not-allowed' 
                      : theme === 'space' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-600/50'
                  }`}
                  title={refreshCooldown > 0 ? `Wait ${getCooldownTime()}` : 'Refresh Servers'}
                >
                  <span className="text-lg">🔄</span>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMinimized(true);
                  }}
                  className={`p-1 rounded transition-colors ${
                    theme === 'space' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-600/50'
                  }`}
                  title="Minimize"
                >
                  <span className="text-lg">📦</span>
                </button>
              </div>
            </div>

            {/* Content */}
            {selectedGuild ? (
              <div className="space-y-2">
                <div className={`text-sm ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  <div className="flex items-center justify-between">
                    <span>Bot Status:</span>
                    <span className={`font-medium ${
                      selectedGuild.bot_present ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedGuild.bot_present ? '✅ Present' : '❌ Missing'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDropdownOpen(true);
                  }}
                  className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'space' 
                      ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300' 
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                >
                  🔄 Change Server
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className={`text-sm mb-3 ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  No server selected
                </div>
                <div className={`text-xs mb-3 ${
                  theme === 'light' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Invite the bot to your Discord server first
                </div>
                {guilds.length > 0 && guilds[0].bot_invite_url && (
                  <a
                    href={guilds[0].bot_invite_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-1 bg-hologram-cyan/20 text-hologram-cyan rounded hover:bg-hologram-cyan/30 transition-colors text-xs font-medium"
                  >
                    🤖 Invite Bot
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dropdown Portal */}
      {dropdownOpen && !isMinimized && createPortal(
        <div
          ref={dropdownRef}
          data-dropdown-portal
          className="fixed z-50 max-h-64 overflow-y-auto bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-lg shadow-2xl"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxWidth: '320px'
          }}
        >
          <div className="p-2">
            {guilds.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-gray-400 text-sm mb-3">No servers found</p>
                <button
                  onClick={handleRefresh}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 px-2">
                  Available Servers ({guilds.length})
                </div>
                {guilds.map((guild) => (
                  <button
                    key={guild.id}
                    onClick={() => {
                      if (onGuildSelect && guild && guild.id) {
                        onGuildSelect(guild);
                        setDropdownOpen(false);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors mb-1 ${
                      selectedGuild?.id === guild.id
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-lg">
                        {getGuildIcon(guild) ? (
                          <img
                            src={getGuildIcon(guild)}
                            alt={guild.name}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-hologram-cyan font-semibold text-sm">
                            {getGuildInitials(guild.name)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{guild.name}</div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span className={guild.bot_present ? 'text-green-400' : 'text-red-400'}>
                            {guild.bot_present ? '✅ Bot Present' : '❌ Bot Missing'}
                          </span>
                          {guild.owner && <span>👑 Owner</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
