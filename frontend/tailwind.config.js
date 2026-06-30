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
        // ClaimFlow brand palette
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Dark surface palette (cool teal-tinted black)
        surface: {
          950: '#040b0a',
          900: '#081311',
          800: '#0d1c1a',
          700: '#142824',
          600: '#1c3530',
          500: '#26443f',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        display: ['var(--font-display)', 'var(--font-inter)', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      spacing: {
        4.5: '1.125rem',
      },
      backgroundImage: {
        'gradient-teal': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)',
        'gradient-orange': 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
        'gradient-danger': 'linear-gradient(135deg, #f43f5e 0%, #991b1b 100%)',
        'gradient-surface': 'linear-gradient(180deg, #081311 0%, #040b0a 100%)',
        'gradient-brand-text': 'linear-gradient(90deg, #5eead4 0%, #2dd4bf 40%, #fb923c 120%)',
        'grid-teal':
          'linear-gradient(rgba(20,184,166,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.05) 1px, transparent 1px)',
        'noise':
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(20,184,166,0.18), 0 8px 30px -8px rgba(13,148,136,0.45)',
        'glow-orange': '0 0 0 1px rgba(249,115,22,0.25), 0 8px 30px -8px rgba(249,115,22,0.4)',
        'glow-danger': '0 0 0 1px rgba(244,63,94,0.25), 0 8px 30px -8px rgba(244,63,94,0.4)',
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 32px -16px rgba(0,0,0,0.8)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 1.8s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'gradient-shift': 'gradientShift 6s ease infinite',
        'spin-slow': 'spin 8s linear infinite',
        'glow-pulse': 'glowPulse 2.4s ease-in-out infinite',
        'draw-line': 'drawLine 1.4s ease-out forwards',
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { transform: 'translateY(14px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        drawLine: { '0%': { strokeDashoffset: '1' }, '100%': { strokeDashoffset: '0' } },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
