/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        claude: {
          bg: '#F5F4EF',
          card: '#FFFFFF',
          terracotta: {
            light: '#E69B7E',
            DEFAULT: '#D97757',
            dark: '#C05E3E',
          },
          text: {
            dark: '#1E1E1C',
            muted: '#6E6E6B',
          },
          border: '#E6E4DD',
          input: '#FBFBFA',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'ui-serif', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
