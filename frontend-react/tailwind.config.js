/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#121212',
          card: '#1e1e1e',
          panel: '#181818',
        },
        electric: {
          green: '#2ecc71',
          cyan: '#00f5ff',
          neon: '#0aef73',
        },
        charcoal: {
          light: '#2d2d2d',
          dark: '#0a0a0a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

