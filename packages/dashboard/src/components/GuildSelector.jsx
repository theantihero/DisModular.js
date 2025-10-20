/* eslint-env browser, node */
/**
 * GuildSelector Component
 * Allows users to select which Discord guild to configure plugins for
 * @author fkndean_
 * @date 2025-01-27
 */

import _React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../viewmodels/AppViewModel';
import { useToast } from '../hooks/useToast';

export default function GuildSelector({ selectedGuild, onGuildSelect, cachedGuildId, className = '' }) {
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  
  const { refreshGuilds, refreshCooldown, getCooldownTime } = useAppStore();
  const toast = useToast();

  useEffect(() => {
    fetchGuilds();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // Remove window.scrollY for fixed positioning
        left: rect.left, // Remove window.scrollX for fixed positioning
        width: rect.width
      });
    }
  }, [dropdownOpen]);

  // Close dropdown when clicking outside and handle scroll
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is on the button or inside the dropdown portal
      const isButtonClick = buttonRef.current?.contains(event.target);
      const isDropdownClick = event.target.closest('[data-dropdown-portal]');
      
      if (!isButtonClick && !isDropdownClick) {
        setDropdownOpen(false);
      }
    };

    const handleScroll = () => {
      if (dropdownOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8, // Remove window.scrollY for fixed positioning
          left: rect.left, // Remove window.scrollX for fixed positioning
          width: rect.width
        });
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [dropdownOpen]);

  const fetchGuilds = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // eslint-disable-next-line no-undef
      const response = await fetch('/auth/guilds', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch guilds: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Filter to only show guilds where the bot is present
        const guildsWithBot = data.data.filter(guild => guild.bot_present);
        setGuilds(guildsWithBot);
        
        // Smart guild selection: use cached guild if available, otherwise first guild
        if (!selectedGuild && guildsWithBot.length > 0) {
          let guildToSelect = null;
          
          // Try to find cached guild first
          if (cachedGuildId) {
            guildToSelect = guildsWithBot.find(guild => guild.id === cachedGuildId);
          }
          
          // Fallback to first guild if cached guild not found
          if (!guildToSelect) {
            guildToSelect = guildsWithBot[0];
          }
          
          onGuildSelect(guildToSelect);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch guilds');
      }
    } catch (err) {
      console.error('Error fetching guilds:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshGuilds = async () => {
    try {
      const refreshedGuilds = await refreshGuilds();
      // Filter to only show guilds where the bot is present
      const guildsWithBot = refreshedGuilds.filter(guild => guild.bot_present);
      setGuilds(guildsWithBot);
      toast.success('Guilds refreshed successfully!');
      
      // Smart guild selection: use cached guild if available, otherwise first guild
      if (!selectedGuild && guildsWithBot.length > 0) {
        let guildToSelect = null;
        
        // Try to find cached guild first
        if (cachedGuildId) {
          guildToSelect = guildsWithBot.find(guild => guild.id === cachedGuildId);
        }
        
        // Fallback to first guild if cached guild not found
        if (!guildToSelect) {
          guildToSelect = guildsWithBot[0];
        }
        
        onGuildSelect(guildToSelect);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getGuildIcon = (guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
    }
    return null;
  };

  const getGuildInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className={`macos-card p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-2 border-hologram-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-hologram-cyan">Loading Discord servers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`macos-card p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">🚨</div>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchGuilds}
            className="macos-button"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (guilds.length === 0) {
    return (
      <div className={`macos-card p-6 ${className}`}>
        <div className="text-center">
          <div className="text-yellow-400 text-lg mb-2">🤖</div>
          <p className="text-hologram-cyan mb-4">No Discord servers found where the bot is present.</p>
          <p className="text-gray-400 text-sm mb-4">
            The bot needs to be invited to your Discord server before you can configure plugins.
          </p>
          <a
            href={guilds.length > 0 ? guilds[0].bot_invite_url : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="macos-button bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30 hover:border-blue-500/50"
          >
            Invite Bot to Server
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`macos-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white text-lg font-semibold mb-1">Configure Server</h3>
          <p className="text-gray-400 text-sm">Select which Discord server to configure plugins for</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-hologram-cyan text-sm">
            {guilds.length} server{guilds.length !== 1 ? 's' : ''} with bot
          </div>
          <button
            onClick={handleRefreshGuilds}
            disabled={refreshCooldown > 0}
            className={`macos-button px-3 py-1 text-xs ${
              refreshCooldown > 0 
                ? 'opacity-50 cursor-not-allowed text-gray-400' 
                : 'text-hologram-cyan hover:text-white'
            }`}
            title={refreshCooldown > 0 ? `Refresh available in ${getCooldownTime()}` : 'Refresh guild list'}
          >
            {refreshCooldown > 0 ? `⏱️ ${getCooldownTime()}` : '🔄 Refresh'}
          </button>
        </div>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          ref={buttonRef}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 macos-glass rounded-xl text-left text-white transition-all duration-200"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {selectedGuild ? (
              <>
                <div className="w-10 h-10 macos-icon flex items-center justify-center p-1 flex-shrink-0">
                  {getGuildIcon(selectedGuild) ? (
                    <img 
                      src={getGuildIcon(selectedGuild)} 
                      alt={selectedGuild.name} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-hologram-cyan font-semibold text-sm">
                      {getGuildInitials(selectedGuild.name)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-white truncate">{selectedGuild.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-hologram-cyan">
                      {selectedGuild.owner ? '👑 Owner' : '⚡ Admin'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <span className="text-gray-400">Select a server...</span>
            )}
          </div>
          <span className={`text-xl transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

                {/* Dropdown Menu */}
                {dropdownOpen && createPortal(
                  <div 
                    data-dropdown-portal
                    onClick={(e) => e.stopPropagation()}
                    className="fixed macos-card shadow-2xl overflow-hidden max-h-64 overflow-y-auto animate-slide-down" 
                    style={{ 
                      zIndex: 999999,
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      width: `${dropdownPosition.width}px`
                    }}
                  >
                    {(guilds || []).map((guild) => (
                      <button
                        key={guild.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Guild selected with null checks
                          if (onGuildSelect && guild && guild.id) {
                            onGuildSelect(guild);
                            setDropdownOpen(false);
                          }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:macos-glass transition-all duration-200"
                      >
                        <div className="w-10 h-10 macos-icon flex items-center justify-center p-1 flex-shrink-0">
                          {getGuildIcon(guild) ? (
                            <img 
                              src={getGuildIcon(guild)} 
                              alt={guild.name} 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-hologram-cyan font-semibold text-sm">
                              {getGuildInitials(guild.name)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-white text-sm truncate">{guild.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-hologram-cyan">
                              {guild.owner ? '👑 Owner' : '⚡ Admin'}
                            </span>
                            <span className="text-xs text-energy-green">
                              🤖 Bot Present
                            </span>
                          </div>
                        </div>
                        {selectedGuild?.id === guild.id && (
                          <span className="text-energy-green text-lg">✓</span>
                        )}
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
      </div>

      {selectedGuild && (
        <div className="mt-4 p-3 macos-glass rounded-lg">
          <div className="flex items-center gap-2 text-sm text-hologram-cyan">
            <span>🎯</span>
            <span>Selected: <strong>{selectedGuild.name}</strong></span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Plugin configurations will be applied to this server
          </p>
        </div>
      )}
    </div>
  );
}
