/** @type {import('tailwindcss').Config} */
const cssVarColor = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: cssVarColor('--color-primary-rgb'),
          light: cssVarColor('--color-primary-light-rgb'),
          dark: cssVarColor('--color-primary-dark-rgb'),
          soft: cssVarColor('--color-primary-soft-rgb'),
        },
        secondary: {
          DEFAULT: cssVarColor('--color-secondary-rgb'),
          soft: cssVarColor('--color-gold-soft-rgb'),
        },
        gold: {
          DEFAULT: cssVarColor('--color-secondary-rgb'),
          soft: cssVarColor('--color-gold-soft-rgb'),
        },
        accent: {
          DEFAULT: cssVarColor('--color-accent-rgb'),
        },
        surface: {
          DEFAULT: cssVarColor('--color-surface-rgb'),
          alt: cssVarColor('--color-surface-alt-rgb'),
        },
        border: {
          DEFAULT: cssVarColor('--color-border-rgb'),
        },
        muted: {
          DEFAULT: cssVarColor('--color-muted-rgb'),
        },
        danger: {
          DEFAULT: cssVarColor('--color-danger-rgb'),
          light: cssVarColor('--color-danger-light-rgb'),
        },
        success: {
          DEFAULT: cssVarColor('--color-success-rgb'),
          light: cssVarColor('--color-success-light-rgb'),
        },
        warning: {
          DEFAULT: cssVarColor('--color-warning-rgb'),
          light: cssVarColor('--color-warning-light-rgb'),
        },
        info: {
          DEFAULT: cssVarColor('--color-info-rgb'),
        },
      },
      backgroundColor: {
        page: cssVarColor('--color-bg-rgb'),
      },
      textColor: {
        base: cssVarColor('--color-text-rgb'),
        heading: cssVarColor('--color-text-heading-rgb'),
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.625rem',
        lg: '0.875rem',
        xl: '1.125rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        card: 'var(--shadow-sm)',
        dropdown: 'var(--shadow-md)',
        modal: 'var(--shadow-lg)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
