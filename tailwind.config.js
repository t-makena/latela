/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'latela-primary': '#007A4D',
        'latela-secondary': '#FFB81C',
        'latela-accent': '#DE3831',
        'zar-green': '#007A4D',
        'zar-gold': '#FFB81C',
        'south-african-red': '#DE3831',
      },
      fontFamily: {
        'latela': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}