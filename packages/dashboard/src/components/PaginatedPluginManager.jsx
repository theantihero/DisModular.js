import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * PaginatedPluginManager Component
 * 
 * Provides a paginated view of plugins with search functionality
 * Displays 4 plugins per page with navigation controls
 * 
 * @param {Object} props - Component props
 * @param {Array} props.plugins - Array of plugin objects
 * @param {Object} props.selectedGuild - Currently selected guild
 * @param {Function} props.handleTogglePlugin - Function to toggle plugin status
 * @param {Function} props.handleDeletePlugin - Function to delete a plugin
 * @param {Set} props.togglingPlugins - Set of plugin IDs currently being toggled
 * @param {Set} props.deletingPlugins - Set of plugin IDs currently being deleted
 * @param {Function} props.arePluginButtonsDisabled - Function to check if buttons should be disabled
 * @param {Function} props.getPluginIcon - Function to get plugin icon
 * @param {string} props.theme - Current theme ('space' or 'default')
 * 
 * @returns {JSX.Element} The paginated plugin manager component
 */
const PaginatedPluginManager = ({
  plugins = [],
  selectedGuild,
  handleTogglePlugin,
  handleDeletePlugin,
  togglingPlugins,
  deletingPlugins,
  arePluginButtonsDisabled,
  getPluginIcon,
  theme
}) => {
  const navigate = useNavigate();
  
  // State for pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'command', 'event', 'utility', etc.
  
  const pluginsPerPage = 4;
  
  // Filter and search plugins
  const filteredPlugins = useMemo(() => {
    let filtered = plugins;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(plugin => 
        plugin.name.toLowerCase().includes(query) ||
        plugin.description.toLowerCase().includes(query) ||
        plugin.author?.toLowerCase().includes(query) ||
        plugin.type.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(plugin => {
        const isActive = selectedGuild ? plugin.guild_enabled : plugin.enabled;
        return statusFilter === 'active' ? isActive : !isActive;
      });
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(plugin => 
        plugin.type.toLowerCase() === typeFilter.toLowerCase()
      );
    }
    
    return filtered;
  }, [plugins, searchQuery, statusFilter, typeFilter, selectedGuild]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredPlugins.length / pluginsPerPage);
  const startIndex = (currentPage - 1) * pluginsPerPage;
  const endIndex = startIndex + pluginsPerPage;
  const currentPlugins = filteredPlugins.slice(startIndex, endIndex);
  
  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);
  
  // Get unique plugin types for filter
  const pluginTypes = useMemo(() => {
    const types = [...new Set(plugins.map(plugin => plugin.type))];
    return types.sort();
  }, [plugins]);
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  // Render search and filter controls
  const renderSearchAndFilters = () => (
    <div className={`p-4 ${
      theme === 'space' 
        ? 'border-b border-hologram-500/30' 
        : 'border-b border-gray-700/50'
    }`}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search plugins by name, description, author, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-2 pl-10 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                theme === 'space'
                  ? 'bg-gray-800/50 border-hologram-500/30 text-white placeholder-gray-400 focus:ring-hologram-500/50 focus:border-hologram-500/50'
                  : 'bg-gray-700/50 border-gray-600/30 text-white placeholder-gray-400 focus:ring-blue-500/50 focus:border-blue-500/50'
              }`}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
        </div>
        
        {/* Status Filter */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
              theme === 'space'
                ? 'bg-gray-800/50 border-hologram-500/30 text-white focus:ring-hologram-500/50 focus:border-hologram-500/50'
                : 'bg-gray-700/50 border-gray-600/30 text-white focus:ring-blue-500/50 focus:border-blue-500/50'
            }`}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
              theme === 'space'
                ? 'bg-gray-800/50 border-hologram-500/30 text-white focus:ring-hologram-500/50 focus:border-hologram-500/50'
                : 'bg-gray-700/50 border-gray-600/30 text-white focus:ring-blue-500/50 focus:border-blue-500/50'
            }`}
          >
            <option value="all">All Types</option>
            {pluginTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Results Summary */}
      <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
        <div>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredPlugins.length)} of {filteredPlugins.length} plugins
          {searchQuery && (
            <span className="ml-2">
              (filtered from {plugins.length} total)
            </span>
          )}
        </div>
        {filteredPlugins.length > 0 && (
          <div className="flex items-center gap-2">
            <span>Page {currentPage} of {totalPages}</span>
          </div>
        )}
      </div>
    </div>
  );
  
  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);
        
        if (currentPage > 3) {
          pages.push('...');
        }
        
        // Show pages around current page
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = start; i <= end; i++) {
          if (!pages.includes(i)) {
            pages.push(i);
          }
        }
        
        if (currentPage < totalPages - 2) {
          pages.push('...');
        }
        
        // Always show last page
        if (!pages.includes(totalPages)) {
          pages.push(totalPages);
        }
      }
      
      return pages;
    };
    
    return (
      <div className={`p-4 ${
        theme === 'space' 
          ? 'border-t border-hologram-500/30' 
          : 'border-t border-gray-700/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed bg-gray-600/20 text-gray-500 border-gray-600/30'
                  : theme === 'space'
                    ? 'bg-gray-800/50 border-hologram-500/30 text-white hover:bg-hologram-500/20 hover:border-hologram-500/50'
                    : 'bg-gray-700/50 border-gray-600/30 text-white hover:bg-blue-500/20 hover:border-blue-500/50'
              }`}
            >
              ← Previous
            </button>
            
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                  disabled={typeof page !== 'number'}
                  className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                    page === currentPage
                      ? theme === 'space'
                        ? 'bg-hologram-500/30 border-hologram-500/50 text-hologram-cyan'
                        : 'bg-blue-500/30 border-blue-500/50 text-blue-300'
                      : typeof page === 'number'
                        ? theme === 'space'
                          ? 'bg-gray-800/50 border-hologram-500/30 text-white hover:bg-hologram-500/20 hover:border-hologram-500/50'
                          : 'bg-gray-700/50 border-gray-600/30 text-white hover:bg-blue-500/20 hover:border-blue-500/50'
                        : 'opacity-50 cursor-not-allowed bg-gray-600/20 text-gray-500 border-gray-600/30'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg border transition-all duration-200 ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed bg-gray-600/20 text-gray-500 border-gray-600/30'
                  : theme === 'space'
                    ? 'bg-gray-800/50 border-hologram-500/30 text-white hover:bg-hologram-500/20 hover:border-hologram-500/50'
                    : 'bg-gray-700/50 border-gray-600/30 text-white hover:bg-blue-500/20 hover:border-blue-500/50'
              }`}
            >
              Next →
            </button>
          </div>
          
          <div className="text-sm text-gray-400">
            Go to page:
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  handlePageChange(page);
                }
              }}
              className={`ml-2 w-16 px-2 py-1 rounded border ${
                theme === 'space'
                  ? 'bg-gray-800/50 border-hologram-500/30 text-white'
                  : 'bg-gray-700/50 border-gray-600/30 text-white'
              }`}
            />
          </div>
        </div>
      </div>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <span className="text-6xl mb-4 block">🔍</span>
      <h3 className="text-white text-lg font-medium mb-2">No plugins found</h3>
      <p className="text-gray-400 mb-6">
        {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
          ? 'Try adjusting your search or filters to find plugins'
          : 'No plugins are available'
        }
      </p>
      {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
        <button
          onClick={() => {
            setSearchQuery('');
            setStatusFilter('all');
            setTypeFilter('all');
          }}
          className={`macos-button px-6 py-3 font-medium flex items-center gap-2 transition-all duration-200 mx-auto text-white hover:scale-105`}
        >
          <span className="text-lg">🔄</span>
          <span>Clear Filters</span>
        </button>
      )}
    </div>
  );
  
  // Render plugin card
  const renderPluginCard = (plugin) => {
    const isActive = selectedGuild ? plugin.guild_enabled : plugin.enabled;
    const _statusColor = isActive ? 'energy-green' : 'red-400';
    const statusEmoji = isActive ? '🟢' : '🔴';
    
    return (
      <div 
        key={plugin.id} 
        className={`macos-card transition-all duration-300 hover:scale-[1.02] border-2 ${
          isActive 
            ? 'border-energy-green/50 shadow-energy-green/20 shadow-lg' 
            : 'border-red-400/50 shadow-red-400/20 shadow-lg'
        }`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 macos-icon flex items-center justify-center">
                <span className="text-white text-xl">{getPluginIcon(plugin.type)}</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{plugin.name}</h3>
                <p className="text-gray-400 text-sm">v{plugin.version}</p>
              </div>
            </div>
            
            <div className={`macos-badge flex items-center space-x-2 ${
              isActive 
                ? 'bg-energy-green/20 border-energy-green/30' 
                : 'bg-red-400/20 border-red-400/30'
            }`}>
              <span className="text-lg">{statusEmoji}</span>
              <span className={`text-xs font-medium capitalize ${
                isActive ? 'text-energy-green' : 'text-red-400'
              }`}>
                {selectedGuild ? (plugin.guild_enabled ? 'Active' : 'Inactive') : (plugin.enabled ? 'Active' : 'Inactive')}
              </span>
              {selectedGuild && plugin.enabled !== plugin.guild_enabled && (
                <span className="text-xs text-gray-400">
                  ({plugin.enabled ? 'Global' : 'Disabled'})
                </span>
              )}
            </div>
          </div>

          <p className="text-gray-300 text-sm mb-4 line-clamp-2">{plugin.description}</p>

          <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
            <span className="flex items-center">
              <span className="mr-1">👤</span>
              {plugin.author || 'Unknown'}
            </span>
            <span className="flex items-center">
              <span className="mr-1">⚡</span>
              {plugin.type}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => handleTogglePlugin(plugin)}
                disabled={togglingPlugins.has(plugin.id) || arePluginButtonsDisabled()}
                className={`macos-button text-xs font-medium ${
                  selectedGuild ? (plugin.guild_enabled 
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30 hover:border-red-500/50' 
                    : 'bg-energy-green/20 hover:bg-energy-green/30 text-energy-green border-energy-green/30 hover:border-energy-green/50')
                    : (plugin.enabled 
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30 hover:border-red-500/50' 
                    : 'bg-energy-green/20 hover:bg-energy-green/30 text-energy-green border-energy-green/30 hover:border-energy-green/50')
                } ${(togglingPlugins.has(plugin.id) || arePluginButtonsDisabled()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={
                  arePluginButtonsDisabled() 
                    ? 'Please wait for data to load...' 
                    : togglingPlugins.has(plugin.id) 
                      ? 'Toggling plugin...' 
                      : selectedGuild 
                        ? (plugin.guild_enabled ? 'Disable plugin for this guild' : 'Enable plugin for this guild')
                        : (plugin.enabled ? 'Disable plugin globally' : 'Enable plugin globally')
                }
              >
                {togglingPlugins.has(plugin.id) ? (
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  selectedGuild ? (plugin.guild_enabled ? '🔴 Disable' : '🟢 Enable') : (plugin.enabled ? '🔴 Disable' : '🟢 Enable')
                )}
              </button>

              <button
                onClick={() => navigate(`/plugins/${plugin.id}/edit`)}
                disabled={arePluginButtonsDisabled()}
                className={`macos-button text-xs font-medium bg-hologram-500/20 hover:bg-hologram-500/30 text-hologram-cyan border-hologram-500/30 hover:border-hologram-500/50 ${
                  arePluginButtonsDisabled() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={
                  arePluginButtonsDisabled() 
                    ? 'Please wait for data to load...' 
                    : 'Edit plugin configuration'
                }
              >
                ✏️ Edit
              </button>
            </div>

            <button
              onClick={() => handleDeletePlugin(plugin)}
              disabled={deletingPlugins.has(plugin.id) || arePluginButtonsDisabled()}
              className={`macos-button text-xs font-medium ${
                (deletingPlugins.has(plugin.id) || arePluginButtonsDisabled())
                  ? 'opacity-50 cursor-not-allowed bg-gray-500/20 text-gray-400 border-gray-500/30' 
                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30 hover:border-red-500/50'
              }`}
              title={
                arePluginButtonsDisabled() 
                  ? 'Please wait for data to load...' 
                  : deletingPlugins.has(plugin.id) 
                    ? 'Deleting plugin...' 
                    : 'Delete this plugin permanently'
              }
            >
              {deletingPlugins.has(plugin.id) ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                '🗑️ Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-0">
      {/* Search and Filter Controls */}
      {renderSearchAndFilters()}
      
      {/* Plugin Grid */}
      <div className="p-6">
        {currentPlugins.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentPlugins.map(renderPluginCard)}
          </div>
        )}
      </div>
      
      {/* Pagination Controls */}
      {renderPagination()}
    </div>
  );
};

export default PaginatedPluginManager;
