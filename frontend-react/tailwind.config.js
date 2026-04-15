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
          main: 'var(--bg-main)',
          card: 'var(--bg-card)',
          panel: 'var(--bg-panel)',
        },
        text: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)',
          dim: 'var(--text-dim)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          glow: 'var(--primary-glow)',
        },
        accent: 'var(--accent)',
        border: {
          subtle: 'var(--border-subtle)',
          bright: 'var(--border-bright)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        premium: 'var(--shadow-premium)',
      }
    },
  },
  plugins: [],
}

