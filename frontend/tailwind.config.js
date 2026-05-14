/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#212121',
        'sidebar-bg': '#171717',
        'hover-bg': '#2F2F2F',
        'input-bg': '#303030',
        'border-color': '#3A3A3A',
        'text-primary': '#FFFFFF',
        'text-secondary': '#B4B4B4',
        'accent': '#4F7CFF',
        'danger': '#EF4444',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-dots': 'bounce 1.4s infinite ease-in-out both',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        bounce: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.5' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        slideIn: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}