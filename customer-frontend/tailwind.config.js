/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agro: {
          dark: '#0E382A',
          green: '#1B4D3E',
          light: '#2E7D32',
          lime: '#4CAF50',
          gold: '#D97706',
          amber: '#F59E0B',
          cream: '#F9FAF7',
          surface: '#F3F6F1',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
