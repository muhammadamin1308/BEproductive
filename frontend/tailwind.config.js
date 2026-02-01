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
        primary: "#00E676", // Vibrant neon green
        "primary-dark": "#00C853",
        "background-light": "#FAFAFA", // Stark off-white
        "background-dark": "#121212", 
        "surface-light": "#FFFFFF",
        "surface-dark": "#1E1E1E",
        "border-light": "#333333", // Softened from pure black to charcoal
        "border-dark": "#333333",
        "text-main-light": "#000000", // Stark black
        "text-muted-light": "#666666",
        "text-main-dark": "#E0E0E0",
        "text-muted-dark": "#888888",
      },
      fontFamily: {
        display: ["JetBrains Mono", "monospace"],
        mono: ["JetBrains Mono", "monospace"],
        sans: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0px", // Sharper corners for brutalism
      },
      boxShadow: {
        'tech': '4px 4px 0px 0px #444444', // Softened shadow color
        'tech-hover': '6px 6px 0px 0px #444444',
        'tech-sm': '2px 2px 0px 0px #444444',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'), 
    require('@tailwindcss/forms')
  ],
}
