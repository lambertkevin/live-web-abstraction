/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontSize: {
      xs: '0.55rem',
      sm: '0.7rem',
      base: '0.8rem',
      md: '0.85rem',
      lg: '0.9rem',
      xl: '1rem',
      '2xl': '1.25rem',
      '3xl': '1.563rem',
      '4xl': '1.953rem',
      '5xl': '2.441rem',
    },
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        ledger: {
          primary: '#c4b5fd',
          secondary: '#ffffff',
          accent: '#ea580c',
          neutral: '#27272a',
          'base-100': '#18181b',
          info: '#e9d5ff',
          success: '#84cc16',
          warning: '#f59e0b',
          error: '#dc2626',
          '--rounded-btn': '0.3rem', // border radius rounded-btn utility class, used in buttons and similar element
        },
      },
    ],
  },
};
