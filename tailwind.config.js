/**
 * 设计令牌（复刻站：在此配置，用类名即可）
 *
 * 字号
 * - text-xs   → 10.5px；line-height: calc(1 / 0.75)
 * - text-sm   → 12.25px；line-height: calc(1.25 / 0.875)
 * - text-10px → font-size: 0.625rem；line-height: 0.875rem
 *
 * 字重
 * - font-semibold → 600
 * - font-bold     → 700
 *
 * 数字间距（gap-4、py-3 等）：Tailwind v4 依赖 `@theme { --spacing }`，
 * 基准写在 `app/globals.css` 的 `@theme`（0.21875rem），无法单靠本文件的 theme.extend 替代。
 *
 * Case battle 顶栏 tab 选中底条：`animate-tab-bar-in`、`animate-tab-glow`（见 extend.keyframes / animation）
 *
 * `shadow-lg` / `hover:shadow-lg`：与参考站一致的 rgba 写法（#0000001a ×2）
 *
 * `duration-500` → transition-duration: 0.5s（与参考站一致写法）
 *
 * 宽度 `w-20` / `w-24` / `w-28` / `w-80`：在 `extend.width` 写死为 5/6/7/20 rem，
 * 与参考站一致，且不受 `globals.css` 里 `@theme --spacing` 对数字档的影响。
 */

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
      transitionDuration: {
        500: '0.5s',
      },
      keyframes: {
        'tab-bar-in': {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
        'tab-glow': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.65' },
        },
      },
      animation: {
        'tab-bar-in':
          'tab-bar-in 0.45s cubic-bezier(0.28, 0.84, 0.16, 1) both',
        'tab-glow': 'tab-glow 2.2s ease-in-out infinite',
      },
      fontSize: {
        xs: ['10.5px', { lineHeight: 'calc(1 / 0.75)' }],
        sm: ['12.25px', { lineHeight: 'calc(1.25 / 0.875)' }],
        '10px': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      fontWeight: {
        semibold: '600',
        bold: '700',
      },
      colors: {
        navy: {
          200: '#B6BBCE',
          250: '#9AA0B4',
          300: '#8B92A8',
          400: '#858DAD',
          500: '#2E3244',
          600: '#23232D',
          700: '#1F1F27',
          800: '#17171c',
          900: '#0D0F14',
        },
        gold: {
          DEFAULT: '#FFCB77',
          400: '#FFCB77',
          800: '#332918',
        },
        lime: {
          300: '#D6FF6F',
          400: '#D1FA2E',
        },
        'grass-green': '#324600',
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
      boxShadow: {
        lg: '0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a',
      },
      width: {
        20: '5rem',
        24: '6rem',
        28: '7rem',
        80: '20rem',
      },
    },
  },
  plugins: [],
}
