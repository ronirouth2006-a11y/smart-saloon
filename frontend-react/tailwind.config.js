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
          DEFAULT: 'var(--bg-dark)',
          card: 'var(--bg-card)',
          panel: 'var(--bg-panel)',
        },
        text: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)',
        },
        electric: {
          green: 'var(--primary)',
          cyan: 'var(--accent)',
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

