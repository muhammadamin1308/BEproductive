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
        // New Command Center design palette
        primary: "#00E676", // Vibrant neon green
        "primary-dark": "#00C853",
        
        // Background colors
        "background-light": "#F8F9FA",
        "background-dark": "#121212",
        
        // Surface colors (cards, panels)
        "surface-light": "#FFFFFF",
        "surface-dark": "#1E1E1E",
        
        // Border colors
        "border-light": "#E0E0E0",
        "border-dark": "#333333",
        
        // Text colors
        "text-main-light": "#121212",
        "text-muted-light": "#666666",
        "text-main-dark": "#E0E0E0",
        "text-muted-dark": "#888888",
        
        // Legacy support (for gradual migration)
        cta: "#00E676",
        surface: "var(--color-surface)",
        "primary-text": "var(--color-primary-text)",
        "secondary-text": "var(--color-secondary-text)",
        "primary-bg": "var(--color-primary-bg)",
      },
      fontFamily: {
        display: ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"JetBrains Mono"', 'monospace'], // Override default to mono
      },
      borderRadius: {
        DEFAULT: "2px", // Technical sharp corners
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'tech': '2px 2px 0px 0px rgba(0,0,0,0.1)',
      },
      letterSpacing: {
        'wider-tech': '0.2em',
      },
    },
  },
  plugins: [],
}
