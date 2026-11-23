/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        matte: {
          950: '#070709', // Main background deep matte
          900: '#0f0f13', // Card surface
          850: '#15151a', // Elevated surface
          800: '#1d1d24', // Inputs, nested panels
          700: '#2b2b36', // Borders
          600: '#3d3d4d',
        },
        gold: {
          100: '#fef9e7',
          200: '#fcf0c4',
          300: '#f9e397',
          400: '#f5d061',
          500: '#d4af37', // Classic metallic gold
          600: '#b89428',
          700: '#94721c',
          800: '#755717',
          900: '#533b11',
          950: '#302008',
        },
      },
      boxShadow: {
        'gold-sm': '0 2px 10px rgba(212, 175, 55, 0.15)',
        'gold-md': '0 4px 20px rgba(212, 175, 55, 0.25)',
        'gold-lg': '0 8px 30px rgba(212, 175, 55, 0.35)',
        'gold-glow': '0 0 25px rgba(245, 208, 97, 0.3)',
        'inner-matte': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'gold-metallic': 'linear-gradient(135deg, #fceaa7 0%, #d4af37 50%, #9e7a1b 100%)',
        'gold-card': 'linear-gradient(145deg, rgba(212, 175, 55, 0.08) 0%, rgba(15, 15, 19, 0.95) 100%)',
      }
    },
  },
  plugins: [],
}
