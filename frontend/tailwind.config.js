/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: 'var(--color-primary-bg)',
          text: 'var(--color-primary-text)',
        },
        secondary: {
          text: 'var(--color-secondary-text)', 
          accent: 'var(--color-secondary-accent)',
        },
        surface: 'var(--color-surface)',
        cta: 'var(--color-cta)', 
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Assuming Inter is available or we'll use system default
      }
    },
  },
  plugins: [],
}
