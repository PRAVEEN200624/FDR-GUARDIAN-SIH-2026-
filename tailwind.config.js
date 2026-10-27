/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: {
            DEFAULT: '#0c2340',
            50: '#f0f5fa',
            100: '#e1ebf4',
            200: '#c2d7e9',
            300: '#93bbda',
            400: '#5e9bc6',
            500: '#387eb2',
            600: '#276495',
            700: '#205079',
            800: '#1d4464',
            900: '#0c2340',
            950: '#071629',
          },
          saffron: {
            DEFAULT: '#d97706',
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
          },
          green: {
            DEFAULT: '#15803d',
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          border: '#cbd5e1',
          bg: '#f8fafc',
          card: '#ffffff',
          surface: '#f1f5f9'
        }
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
