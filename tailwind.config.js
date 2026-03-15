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
        primary: '#6B8F71',
        'primary-dark': '#4A6B50',
        secondary: '#F4A261',
        accent: '#E9C46A',
        background: '#FDFAF6',
        surface: '#FFFFFF',
        'text-primary': '#2D3436',
        'text-muted': '#636E72',
        border: '#E8E4DE',
        success: '#81B29A',
        warning: '#F4A261',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Nunito', 'Quicksand', 'sans-serif'],
        body: ['var(--font-body)', 'DM Sans', 'Source Sans Pro', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        button: '8px',
        'large-cta': '24px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      fontSize: {
        'hero': ['48px', { lineHeight: '1.1' }],
        'hero-mobile': ['36px', { lineHeight: '1.2' }],
      },
      maxWidth: {
        'container': '1200px',
      },
    },
  },
  plugins: [],
}