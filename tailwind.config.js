/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:  '#1B3A6B',
          gold:  '#C9922A',
          green: '#1A7A3A',
          red:   '#AA2222',
        },
        'light-blue': '#EAF0FB',
        'light-gold': '#FDF6E3',
      }
    },
  },
  plugins: [],
}
