/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.28, 0.84, 0.16, 1)',
      },
      colors: {
        navy: {
          200: '#B6BBCE',
          300: '#8B92A8',
          400: '#6B7289',
          500: '#4C5268',
          600: '#363B4F',
          800: '#252A38',
          900: '#0D0F14',
        },
        lime: {
          400: '#D1FA2E',
        },
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
