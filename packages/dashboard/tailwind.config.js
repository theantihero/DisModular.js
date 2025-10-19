/**
 * Tailwind CSS Configuration
 * @author fkndean_
 * @date 2025-01-18
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        discord: {
          blurple: '#5865F2',
          green: '#57F287',
          yellow: '#FEE75C',
          fuchsia: '#EB459E',
          red: '#ED4245',
          white: '#FFFFFF',
          black: '#23272A'
        },
        cosmic: {
          blue: '#1e3a8a',
          purple: '#7c3aed',
          white: '#f8fafc',
          black: '#0f0f23',
          pink: '#ec4899',
          cyan: '#06b6d4',
          green: '#10b981'
        },
        nebula: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87'
        },
        hologram: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'star-twinkle': 'starTwinkle 2s ease-in-out infinite',
        'nebula-float': 'nebulaFloat 8s ease-in-out infinite',
        'planet-rotate': 'planetRotate 20s linear infinite',
        'galaxy-spin': 'galaxySpin 30s ease-in-out infinite',
        'shooting-star': 'shootingStar 3s ease-out infinite',
        'hologram-flicker': 'hologramFlicker 0.1s ease-in-out infinite',
        'scanline': 'scanline 2s linear infinite',
        'energy-pulse': 'energyPulse 2s ease-in-out infinite',
        'cosmic-glow': 'cosmicGlow 3s ease-in-out infinite'
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '40px'
      }
    }
  },
  plugins: []
};

