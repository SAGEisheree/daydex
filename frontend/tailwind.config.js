/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Adding a monospace font to match the "SOULDEX" and "Test your personality" style
        'retro': ['"Courier New"', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [
    require("daisyui")
  ],
  daisyui: {
    themes: [
      {
        "souldex-theme": {
          "primary": "#000000",          // Black for the bold buttons/titles
          "secondary": "#45BFDB",        // Your signature cyan
          "accent": "#FAD02C",           // A playful yellow for accents
          "neutral": "#181a2a",
          
          
          
          "base-100": "#54d7f5ff",         // Bright, solid "Mango" orange
  "base-200": "#7bd9eeff",         // Slightly deeper, more saturated
  "base-300": "#8be3f7ff",
          
          
          
          
          // Setting the BG to your cyan
          "base-content": "#000000",     // Text should be black by default
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",

          "--rounded-btn": "0.5rem",     // Slightly rounded like the screenshot
          "--btn-text-case": "lowercase", // Matches the "Start test" look
        },
      },
      "aqua", "retro"
    ],
  },
}