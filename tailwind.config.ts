import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        lavender: {
          deep: '#4a3f6b',
          medium: '#7c6a9a',
          soft: '#b8a9c9',
          pale: '#e8e0f0',
        },
        moon: {
          cream: '#f5f0e8',
          gold: '#d4af37',
        },
        night: {
          dark: '#1a1425',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config











