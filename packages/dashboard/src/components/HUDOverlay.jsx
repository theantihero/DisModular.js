/**
 * HUD Overlay Component
 * Sci-fi UI elements including corner brackets, scanlines, and grid
 * @author fkndean_
 * @date 2025-01-18
 */

import { useEffect, useState } from 'react';

export function HUDOverlay() {
  const [scanlinePosition, setScanlinePosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanlinePosition(prev => (prev + 1) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-16 h-16">
        <div className="absolute top-0 left-0 w-8 h-1 bg-hologram-500 animate-energy-pulse"></div>
        <div className="absolute top-0 left-0 w-1 h-8 bg-hologram-500 animate-energy-pulse"></div>
      </div>
      
      <div className="absolute top-4 right-4 w-16 h-16">
        <div className="absolute top-0 right-0 w-8 h-1 bg-hologram-500 animate-energy-pulse"></div>
        <div className="absolute top-0 right-0 w-1 h-8 bg-hologram-500 animate-energy-pulse"></div>
      </div>
      
      <div className="absolute bottom-4 left-4 w-16 h-16">
        <div className="absolute bottom-0 left-0 w-8 h-1 bg-hologram-500 animate-energy-pulse"></div>
        <div className="absolute bottom-0 left-0 w-1 h-8 bg-hologram-500 animate-energy-pulse"></div>
      </div>
      
      <div className="absolute bottom-4 right-4 w-16 h-16">
        <div className="absolute bottom-0 right-0 w-8 h-1 bg-hologram-500 animate-energy-pulse"></div>
        <div className="absolute bottom-0 right-0 w-1 h-8 bg-hologram-500 animate-energy-pulse"></div>
      </div>

      {/* Scanline Effect */}
      <div 
        className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-hologram-500 to-transparent opacity-30"
        style={{ 
          top: `${scanlinePosition}%`,
          animation: 'scanline 2s linear infinite'
        }}
      ></div>

      {/* Grid Lines */}
      <div className="absolute inset-0 opacity-10">
        {/* Vertical grid lines */}
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px bg-hologram-500"
            style={{ left: `${(i + 1) * 5}%` }}
          ></div>
        ))}
        
        {/* Horizontal grid lines */}
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 h-px bg-hologram-500"
            style={{ top: `${(i + 1) * 6.67}%` }}
          ></div>
        ))}
      </div>

      {/* Corner Details */}
      <div className="absolute top-8 left-8 w-2 h-2 bg-hologram-500 animate-star-twinkle"></div>
      <div className="absolute top-8 right-8 w-2 h-2 bg-hologram-500 animate-star-twinkle" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-8 left-8 w-2 h-2 bg-hologram-500 animate-star-twinkle" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-8 right-8 w-2 h-2 bg-hologram-500 animate-star-twinkle" style={{ animationDelay: '1.5s' }}></div>

      {/* Status Indicators */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-energy-green rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-hologram-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          <div className="w-2 h-2 bg-nebula-purple rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
        </div>
      </div>

      {/* Side Panel Brackets */}
      <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
        <div className="w-8 h-16 border-l-2 border-hologram-500 border-t-2 border-b-2 opacity-50"></div>
      </div>
      
      <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
        <div className="w-8 h-16 border-r-2 border-hologram-500 border-t-2 border-b-2 opacity-50"></div>
      </div>

      {/* Radar/Sonar Ping Effect */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-4 h-4 border border-hologram-500 rounded-full animate-ping opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-hologram-500 rounded-full"></div>
      </div>

      {/* Data Stream Lines */}
      <div className="absolute top-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-hologram-500 to-transparent opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-hologram-500 to-transparent opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
    </div>
  );
}

export default HUDOverlay;
