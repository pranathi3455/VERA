/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#EEF2FB',
        'secondary-bg': '#E6EBF8',
        surface: '#F8F9FE',
        'surface-elevated': '#FFFFFF',
        'vera-primary': '#17213D',
        'vera-secondary': '#5E6882',
        'vera-muted': '#7C849A',
        'vera-accent': '#7B61FF',
        'vera-accent-hover': '#694FE0',
        'vera-accent-secondary': '#6366F1',
        'vera-accent-soft': '#EEF0FD',
        'vera-border': '#D5DAEA',
        'vera-border-subtle': '#E2E6F5',
        'vera-success': '#789884',
        'vera-success-bg': '#E4EEE7',
        'vera-warning': '#A9966B',
        'vera-warning-bg': '#F1ECDE',
        'vera-danger': '#A87979',
        'vera-danger-bg': '#F2E5E5',
        'vera-info': '#6366F1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'vera-sm': '0 1px 3px rgba(23, 33, 61, 0.04)',
        'vera-md': '0 4px 12px rgba(23, 33, 61, 0.06)',
        'vera-lg': '0 10px 28px rgba(123, 97, 255, 0.08)',
        'vera-glow': '0 0 30px rgba(123, 97, 255, 0.25)',
      }
    },
  },
  plugins: [],
}
