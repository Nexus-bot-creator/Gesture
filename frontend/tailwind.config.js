/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#030712',
          darker: '#090d16',
          dark: '#111827',
          gray: '#1f2937',
          light: '#f3f4f6',
          accent: '#06b6d4', // Cyan
          purple: '#a855f7', // Purple
          emerald: '#10b981', // Emerald
          rose: '#f43f5e', // Rose
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.5)',
        'neon-purple': '0 0 15px rgba(168, 85, 247, 0.5)',
        'neon-rose': '0 0 15px rgba(244, 63, 94, 0.5)',
        'neon-emerald': '0 0 15px rgba(16, 185, 129, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
