/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Tokens from docs/ux-spec.md §1.1 (dark mode only)
      colors: {
        bg: '#0d1116',
        'reader-bg': '#000000',
        surface: {
          1: '#12171c',
          sheet: '#161c22',
          group: '#282e35',
          active: '#313942',
          popover: '#28313b',
        },
        overlay: '#080a0d',
        accent: '#7caeec',
        progress: '#a855f7',
        ink: {
          DEFAULT: '#f0f1f2', // titles
          body: '#c1c7ce',    // reading text
          ui: '#e0e3e6',      // UI text
          2: '#959faa',       // secondary
          3: '#6b7178',       // tertiary (small caps domains)
        },
        chip: 'rgba(110,120,131,.15)',
        danger: '#f26d6d',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', '"Source Serif 4"', 'Georgia', 'serif'],
      },
      borderRadius: {
        sheet: '14px',
        group: '12px',
      },
      boxShadow: {
        pop: '0 0 0 1px rgba(0,0,0,.05), 0 1.5px 4px rgba(0,0,0,.1), 0 8px 24px rgba(0,0,0,.35)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
