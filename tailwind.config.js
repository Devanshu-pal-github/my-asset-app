/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#374151', // Pastel black for buttons
        'primary-light': '#4B5563', // Hover states
        'primary-dark': '#1F2A44', // Active states
        'error-red': '#EF4444', // Error states
        'secondary-green': '#10B981', // Success states
        'background-offwhite': '#F5F2EE', // Main background
        'card-white': '#FFFFFF', // Card background
        'sidebar-selected': '#D1D5DB', // More noticeable selection
        'text-dark': '#1F2A44', // High-contrast text
        'text-light': '#6B7280', // Secondary text
        'border-gray': '#D1D5DB', // Borders
      },
      borderRadius: {
        'sm': '6px', // Inputs, buttons
        'md': '8px', // Cards
        'lg': '12px', // Sidebar, topbar
      },
      spacing: {
        'card-gap': '1.5rem',
        'sidebar-width': '18rem', // Comfortable width
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.1)', // Subtle lift
        'sm': '0 2px 4px 0 rgba(0, 0, 0, 0.15)', // Default card shadow
        'md': '0 4px 8px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)', // Hover card shadow
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)', // Topbar/sidebar shadow
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      transitionProperty: {
        'all': 'all',
      },
      transitionDuration: {
        '200': '200ms',
      },
      transitionTimingFunction: {
        'ease-in-out': 'ease-in-out',
      },
    },
  },
  plugins: [],
}