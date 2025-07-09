import type { Config } from 'tailwindcss';

const { fontFamily } = require('tailwindcss/defaultTheme');

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './frontend/components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        green: {
          50: '#F0FDF4',
          500: '#24AE7C',
          600: '#0D2A1F',
        },
        blue: {
          500: '#79B5EC',
          600: '#152432',
        },
        red: {
          500: '#F37877',
          600: '#3E1716',
          700: '#F24E43',
        },
        light: {
          200: '#E8E9E9',
        },
        gray: {
          50: '#F9FAFB',
          300: '#D1D5DB',
        },
        dark: {
          200: '#0D0F10',
          300: '#131619',
          400: '#1A1D21',
          500: '#363A3D',
          600: '#76828D',
          700: '#ABB8C4',
          800: '#1A1D21',
          900: '#0A0A0A',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
      backgroundImage: {
        appointments: "url('https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455208/healthcare/images/healthcare/images/appointments-bg.png')",
        pending: "url('https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455240/healthcare/images/healthcare/images/pending-bg.png')",
        cancelled: "url('https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455210/healthcare/images/healthcare/images/cancelled-bg.png')",
        completed: "url('https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455213/healthcare/images/healthcare/images/completed-bg.png')",
        'light-rays': "url('/assets/images/light-rays.png')",
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        blob1: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '100%': { transform: 'translateY(40px) scale(1.1)' },
        },
        blob2: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '100%': { transform: 'translateY(-30px) scale(1.05)' },
        },
        blob3: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '100%': { transform: 'translateY(30px) scale(1.08)' },
        },
        fadein: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'gradient-move': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
        float: 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 8s ease-in-out 1s infinite',
        blob: 'blob 7s infinite',
        blob1: 'blob1 18s infinite linear alternate',
        blob2: 'blob2 22s infinite linear alternate',
        blob3: 'blob3 20s infinite linear alternate',
        'gradient-move': 'gradient-move 15s ease infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        fadein: 'fadein 0.7s cubic-bezier(.4,0,.2,1) both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
