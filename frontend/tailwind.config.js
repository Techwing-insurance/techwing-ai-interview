/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'techwing-gold': '#CAA928',
        'techwing-orange': '#E2661A',
        'techwing-dark': '#0a0a0a',
        'techwing-card': '#171717',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'speaking-pulse': 'speakPulse 1.2s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 15px #CAA928, 0 0 20px #E2661A' },
          '50%': { opacity: .7, boxShadow: '0 0 5px #CAA928, 0 0 10px #E2661A' },
        },
        speakPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        }
      }
    },
  },
  plugins: [],
}
