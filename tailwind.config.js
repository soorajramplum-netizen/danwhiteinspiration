/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mint:    '#B8D8D8',
        'mint-dark':  '#9DC5C5',
        'mint-light': '#D4E9E9',
        teal:    '#2D6A6A',
        'teal-deep':  '#1A4A4A',
        magenta: '#C4437C',
        'magenta-light': '#D96A99',
        'magenta-dark':  '#9E2E60',
      },
      fontFamily: {
        body: ['Space Grotesk', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
