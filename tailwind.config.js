/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'solana': {
          'green': '#14F195',
          'purple': '#9945FF',
          'blue': '#00C2FF',
          'dark': '#1C1C1C',
          'gray': '#2C2C2C',
        }
      },
    },
  },
  plugins: [],
}

