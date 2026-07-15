/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#09090E',
        midnight: '#0B0B14',
        cardDark: '#121222',
        accentPurple: '#5D33F8',
        accentViolet: '#6366F1',
        accentTeal: '#00F2FE',
        accentBlue: '#38BDF8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      boxShadow: {
        glowPurple: '0 0 15px rgba(93, 51, 248, 0.4)',
        glowTeal: '0 0 15px rgba(0, 242, 254, 0.4)',
        glowRed: '0 0 15px rgba(239, 68, 68, 0.4)',
      }
    },
  },
  plugins: [],
}
