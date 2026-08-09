/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nexora brand
        nexora: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bafc',
          400: '#8193f8',
          500: '#6366f1',  // primary
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Dark theme surfaces
        dark: {
          bg:       '#0d0d0f',
          surface:  '#141418',
          elevated: '#1c1c22',
          border:   '#2a2a35',
          muted:    '#3a3a48',
        },
        // Light theme surfaces
        light: {
          bg:       '#f8f8fc',
          surface:  '#ffffff',
          elevated: '#f0f0f8',
          border:   '#e2e2ee',
          muted:    '#c8c8dc',
        },
      },
      fontFamily: {
        sans:  ['var(--font-body)', 'ui-sans-serif', 'system-ui'],
        mono:  ['var(--font-mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-display)', 'ui-sans-serif'],
      },
      animation: {
        'fade-in':      'fadeIn 0.2s ease-out',
        'slide-up':     'slideUp 0.25s ease-out',
        'slide-in-left':'slideInLeft 0.25s ease-out',
        'pulse-dot':    'pulseDot 1.4s ease-in-out infinite',
        'shimmer':      'shimmer 1.5s infinite',
        'typing':       'typing 1.2s steps(3) infinite',
      },
      keyframes: {
        fadeIn:      { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:     { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: 0, transform: 'translateX(-12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseDot:    {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%':           { transform: 'scale(1)',   opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        typing: {
          '0%':   { content: '.' },
          '33%':  { content: '..' },
          '66%':  { content: '...' },
          '100%': { content: '' },
        },
      },
      boxShadow: {
        'nexora-sm': '0 2px 8px rgba(99,102,241,0.12)',
        'nexora':    '0 4px 24px rgba(99,102,241,0.18)',
        'nexora-lg': '0 8px 48px rgba(99,102,241,0.25)',
        'glass':     '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'nexora-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
        'dark-mesh':  'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 50%)',
        'light-mesh': 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.03) 0%, transparent 50%)',
      },
    },
  },
  plugins: [],
}