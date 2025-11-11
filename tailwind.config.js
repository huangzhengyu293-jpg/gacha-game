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
        'deals-bg': '#22272B',
        'deals-input-bg': '#1D2125',
        'deals-button-bg': '#34383C',
        'deals-price-text': '#7A8084',
        'gray-650': '#34383C',
        'green-100': '#10B981',
      },
      aspectRatio: {
        'battlePack': '3 / 4',
        'battlePackSm': '3 / 4',
        'battlePackMd': '3 / 4',
      },
    },
  },
  plugins: [],
}
