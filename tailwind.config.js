/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        divi: {
          primary: '#8B46FF',
          secondary: '#6366F1',
          accent: '#F59E0B',
          dark: '#1F2937',
          light: '#F9FAFB'
        }
      },
      fontFamily: {
        'divi': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}