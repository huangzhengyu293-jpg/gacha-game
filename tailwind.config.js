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
          250: '#9AA0B4',
          300: '#8B92A8',
          400: '#858DAD',
          500: '#4C5268',
          600: '#23232D',
          700: '#1F1F227',
          800: '#252A38',
          900: '#0D0F14',
        },
        gold: {
          DEFAULT: '#D4AF37',
          400: '#D4B85A',
          800: '#332918',
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
      backgroundImage: {
        'play-responsibly':
          'linear-gradient(90deg, #0e115b 12.8%, #3d1ec1 138.4%)',
      },
    },
  },
  plugins: [],
}
