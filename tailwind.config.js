/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0B0F19',
          card: '#111827',
          border: '#1E293B',
          primary: '#06B6D4',
          accent: '#3B82F6',
          success: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
        }
      }
    },
  },
  plugins: [],
}
