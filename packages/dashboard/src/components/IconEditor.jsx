import React, { useState, useEffect } from 'react';

/**
 * IconEditor Component
 * 
 * Allows users to set custom icons for plugins/commands via URL or emoji
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - Current icon value (URL or emoji)
 * @param {Function} props.onChange - Function called when icon changes
 * @param {string} props.theme - Current theme ('space' or 'default')
 * @param {string} props.label - Label for the icon editor
 * @param {string} props.placeholder - Placeholder text for inputs
 * @param {boolean} props.disabled - Whether the editor is disabled
 * 
 * @returns {JSX.Element} The icon editor component
 */
const IconEditor = ({
  value = '',
  onChange,
  theme = 'default',
  label = 'Icon',
  placeholder = 'Enter emoji or image URL...',
  disabled = false
}) => {
  const [iconType, setIconType] = useState('emoji'); // 'emoji' or 'url'
  const [emojiValue, setEmojiValue] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [isUrlValid, setIsUrlValid] = useState(true);
  
  // Common emojis for quick selection
  const commonEmojis = [
    '🔌', '⚡', '🎮', '🎵', '📊', '🔧', '🛠️', '🎨', '📝', '🔍',
    '🚀', '💡', '⭐', '🎯', '🔔', '📢', '🎪', '🎭', '🎨', '🎬',
    '🎮', '🎲', '🎯', '🎪', '🎭', '🎨', '🎬', '🎵', '🎶', '🎤',
    '🎧', '🎸', '🥁', '🎹', '🎺', '🎷', '🎻', '🎼', '🎵', '🎶'
  ];
  
  // Initialize state based on current value
  useEffect(() => {
    if (value) {
      if (isValidUrl(value)) {
        setIconType('url');
        setUrlValue(value);
        setEmojiValue('');
      } else {
        setIconType('emoji');
        setEmojiValue(value);
        setUrlValue('');
      }
    }
  }, [value]);
  
  // URL validation function with scheme validation to prevent XSS
  const isValidUrl = (url) => {
    try {
      const urlObj = new URL(url);
      // Only allow safe schemes to prevent XSS
      const allowedSchemes = ['http:', 'https:', 'data:'];
      return allowedSchemes.includes(urlObj.protocol);
    } catch {
      return false;
    }
  };
  
  // Handle emoji input change
  const handleEmojiChange = (newEmoji) => {
    setEmojiValue(newEmoji);
    setPreviewError(false);
    if (onChange) {
      onChange(newEmoji);
    }
  };
  
  // Handle URL input change
  const handleUrlChange = (newUrl) => {
    setUrlValue(newUrl);
    const isValid = newUrl === '' || isValidUrl(newUrl);
    setIsUrlValid(isValid);
    setPreviewError(false);
    
    if (onChange && isValid) {
      onChange(newUrl);
    }
  };
  
  // Handle icon type change
  const handleTypeChange = (type) => {
    setIconType(type);
    setPreviewError(false);
    
    if (type === 'emoji' && urlValue) {
      // Switch from URL to emoji, clear URL
      setUrlValue('');
      if (onChange) {
        onChange('');
      }
    } else if (type === 'url' && emojiValue) {
      // Switch from emoji to URL, clear emoji
      setEmojiValue('');
      if (onChange) {
        onChange('');
      }
    }
  };
  
  // Handle image load error
  const handleImageError = () => {
    setPreviewError(true);
  };
  
  // Handle image load success
  const handleImageLoad = () => {
    setPreviewError(false);
  };
  
  // Get current display value
  const getCurrentValue = () => {
    return iconType === 'emoji' ? emojiValue : urlValue;
  };
  
  // Check if current value is valid
  const isCurrentValueValid = () => {
    if (iconType === 'emoji') {
      return emojiValue.trim() !== '';
    } else {
      return urlValue === '' || isValidUrl(urlValue);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${
          theme === 'space' ? 'text-hologram-cyan' : 'text-white'
        }`}>
          {label}
        </label>
      </div>
      
      {/* Icon Type Selector */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => handleTypeChange('emoji')}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
            iconType === 'emoji'
              ? theme === 'space'
                ? 'bg-hologram-500/30 border-hologram-500/50 text-hologram-cyan'
                : 'bg-blue-500/30 border-blue-500/50 text-blue-300'
              : theme === 'space'
                ? 'bg-gray-800/50 border-hologram-500/30 text-white hover:bg-hologram-500/20 hover:border-hologram-500/50'
                : 'bg-gray-700/50 border-gray-600/30 text-white hover:bg-blue-500/20 hover:border-blue-500/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          😀 Emoji
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('url')}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
            iconType === 'url'
              ? theme === 'space'
                ? 'bg-hologram-500/30 border-hologram-500/50 text-hologram-cyan'
                : 'bg-blue-500/30 border-blue-500/50 text-blue-300'
              : theme === 'space'
                ? 'bg-gray-800/50 border-hologram-500/30 text-white hover:bg-hologram-500/20 hover:border-hologram-500/50'
                : 'bg-gray-700/50 border-gray-600/30 text-white hover:bg-blue-500/20 hover:border-blue-500/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          🖼️ Image URL
        </button>
      </div>
      
      {/* Icon Input Section */}
      {iconType === 'emoji' ? (
        <div className="space-y-3">
          {/* Emoji Input */}
          <div>
            <input
              type="text"
              value={emojiValue}
              onChange={(e) => handleEmojiChange(e.target.value)}
              placeholder="Enter emoji (e.g., 🔌, ⚡, 🎮)"
              disabled={disabled}
              maxLength={10}
              className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                theme === 'space'
                  ? 'bg-gray-800/50 border-hologram-500/30 text-white placeholder-gray-400 focus:ring-hologram-500/50 focus:border-hologram-500/50'
                  : 'bg-gray-700/50 border-gray-600/30 text-white placeholder-gray-400 focus:ring-blue-500/50 focus:border-blue-500/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
          
          {/* Common Emojis */}
          <div>
            <p className={`text-sm mb-2 ${
              theme === 'space' ? 'text-hologram-cyan' : 'text-gray-300'
            }`}>
              Quick select:
            </p>
            <div className="flex flex-wrap gap-2">
              {commonEmojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleEmojiChange(emoji)}
                  disabled={disabled}
                  className={`w-10 h-10 rounded-lg border transition-all duration-200 flex items-center justify-center text-lg hover:scale-110 ${
                    emojiValue === emoji
                      ? theme === 'space'
                        ? 'bg-hologram-500/30 border-hologram-500/50'
                        : 'bg-blue-500/30 border-blue-500/50'
                      : theme === 'space'
                        ? 'bg-gray-800/50 border-hologram-500/30 hover:bg-hologram-500/20 hover:border-hologram-500/50'
                        : 'bg-gray-700/50 border-gray-600/30 hover:bg-blue-500/20 hover:border-blue-500/50'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* URL Input */}
          <div>
            <input
              type="url"
              value={urlValue}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Enter image URL (e.g., https://example.com/icon.png)"
              disabled={disabled}
              className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                !isUrlValid && urlValue
                  ? 'border-red-500/50 focus:ring-red-500/50'
                  : theme === 'space'
                    ? 'bg-gray-800/50 border-hologram-500/30 text-white placeholder-gray-400 focus:ring-hologram-500/50 focus:border-hologram-500/50'
                    : 'bg-gray-700/50 border-gray-600/30 text-white placeholder-gray-400 focus:ring-blue-500/50 focus:border-blue-500/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {!isUrlValid && urlValue && (
              <p className="text-red-400 text-sm mt-1">
                Please enter a valid URL
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Icon Preview */}
      <div>
        <p className={`text-sm mb-2 ${
          theme === 'space' ? 'text-hologram-cyan' : 'text-gray-300'
        }`}>
          Preview:
        </p>
        <div className={`w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center ${
          theme === 'space' 
            ? 'border-hologram-500/30 bg-gray-800/20' 
            : 'border-gray-600/30 bg-gray-700/20'
        }`}>
          {getCurrentValue() ? (
            iconType === 'emoji' ? (
              <span className="text-3xl">{getCurrentValue()}</span>
            ) : (
              <div className="relative w-full h-full">
                {previewError ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <span className="text-red-400 text-xs">Error loading image</span>
                  </div>
                ) : (
                  <img
                    src={getCurrentValue()}
                    alt="Icon preview"
                    className="w-full h-full object-cover rounded-lg"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                  />
                )}
              </div>
            )
          ) : (
            <span className={`text-2xl ${
              theme === 'space' ? 'text-hologram-500/50' : 'text-gray-500'
            }`}>
              ?
            </span>
          )}
        </div>
      </div>
      
      {/* Validation Status */}
      {getCurrentValue() && (
        <div className={`text-sm ${
          isCurrentValueValid() 
            ? theme === 'space' ? 'text-energy-green' : 'text-green-400'
            : 'text-red-400'
        }`}>
          {isCurrentValueValid() ? '✅ Icon is valid' : '❌ Icon is invalid'}
        </div>
      )}
    </div>
  );
};

export default IconEditor;
