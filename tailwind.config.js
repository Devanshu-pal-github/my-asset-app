/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#216DCF',
        'error-red': '#F87171',
        'secondary-green': '#10B981',
        'background-offwhite': '#F5F2EE',
        'card-white': '#FFFFFF',
        'sidebar-selected': '#E8E4DD',
        'text-dark': '#333333',
        'text-light': '#757575',
        'border-gray': '#E0E0E0',
      },
      borderRadius: {
        'sidebar-top': '24px',
        'topbar-card': '8px',
      },
      spacing: {
        'card-gap': '1.5rem',
        'sidebar-width': '16rem',
      },
    },
  },
  plugins: [],
}