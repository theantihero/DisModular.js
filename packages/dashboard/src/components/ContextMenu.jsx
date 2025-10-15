/**
 * Context Menu Component
 * Right-click context menu for node editor
 * @author fkndean_
 * @date 2025-10-14
 */

import { useEffect, useRef, useState } from 'react';

/**
 * ContextMenu Component
 * @param {Object} props - Component props
 */
export function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [onClose]);

  const handleSubmenuEnter = (index) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenSubmenu(index);
  };

  const handleSubmenuLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenSubmenu(null);
    }, 100); // Small delay to prevent flickering
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-2xl py-2 min-w-[200px] z-50 animate-fadeIn"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="border-t border-gray-700 my-1"></div>;
        }

        if (item.submenu) {
          return (
            <div 
              key={index} 
              className="relative"
              onMouseEnter={() => handleSubmenuEnter(index)}
              onMouseLeave={handleSubmenuLeave}
            >
              <button
                className={`w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center justify-between ${
                  item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={item.disabled}
              >
                <div className="flex items-center gap-3">
                  {item.icon && <span className="text-gray-400">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Submenu */}
              {openSubmenu === index && (
                <div 
                  className="absolute left-full top-0 -ml-1 z-50"
                  onMouseEnter={() => handleSubmenuEnter(index)}
                  onMouseLeave={handleSubmenuLeave}
                >
                  {/* Invisible bridge to prevent gap */}
                  <div className="absolute left-0 top-0 w-1 h-full -ml-1"></div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl py-2 min-w-[180px]">
                    {item.submenu.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={() => {
                          if (!subItem.disabled) {
                            subItem.onClick();
                            onClose();
                          }
                        }}
                        className={`w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3 ${
                          subItem.disabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={subItem.disabled}
                      >
                        {subItem.icon && <span className="text-gray-400">{subItem.icon}</span>}
                        <span>{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }

        return (
          <button
            key={index}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            className={`w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center justify-between ${
              item.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={item.disabled}
          >
            <div className="flex items-center gap-3">
              {item.icon && <span className="text-gray-400">{item.icon}</span>}
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-gray-500 text-xs font-mono">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ContextMenu;

