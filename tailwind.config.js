/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input-background) / <alpha-value>)',
        ring: 'rgb(var(--primary) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--text-primary) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--button-text) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--button-second-bg) / <alpha-value>)',
          foreground: 'rgb(var(--text-primary) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'rgb(var(--text-secondary) / <alpha-value>)',
          foreground: 'rgb(var(--text-secondary) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--sidebar-item-hover) / <alpha-value>)',
          foreground: 'rgb(var(--text-primary) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--dropdown-background) / <alpha-value>)',
          foreground: 'rgb(var(--text-primary) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--card-background) / <alpha-value>)',
          foreground: 'rgb(var(--text-primary) / <alpha-value>)',
        },
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'border-hover': 'rgb(var(--border-hover) / <alpha-value>)',
        'border-focus': 'rgb(var(--border-focus) / <alpha-value>)',
        'sidebar-bg': 'rgb(var(--sidebar-background) / <alpha-value>)',
        'sidebar-hover': 'rgb(var(--sidebar-item-hover) / <alpha-value>)',
        'sidebar-focus': 'rgb(var(--sidebar-item-focus) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
