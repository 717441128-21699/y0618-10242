/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#E8F0F8',
          100: '#C5D5E8',
          200: '#9CB5D6',
          300: '#7395C4',
          400: '#567CB6',
          500: '#3962A8',
          600: '#2A4E8A',
          700: '#1C3A6C',
          800: '#0F3460',
          900: '#0A2442',
        },
        accent: {
          50: '#E8FAF3',
          100: '#C5F2E1',
          200: '#9DEACF',
          300: '#75E1BD',
          400: '#56DAAE',
          500: '#37D39F',
          600: '#16C79A',
          700: '#0E9E7A',
          800: '#08755A',
          900: '#044C3A',
        },
        warning: {
          500: '#FF6B6B',
          600: '#EE5253',
        },
        dark: {
          50: '#F5F5F7',
          100: '#E8E8EC',
          200: '#D1D1D9',
          300: '#A0A0AE',
          400: '#717181',
          500: '#4A4A5A',
          600: '#3A3A4A',
          700: '#2A2A3A',
          800: '#1A1A2E',
          900: '#12121F',
        },
      },
      fontFamily: {
        display: ['"Chivo Mono"', 'monospace'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};
