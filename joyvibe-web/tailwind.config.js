/** @type {import('tailwindcss').Config} */
export default {
content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FEF1F1',
          100: '#FCE3E3',
          200: '#F9C7C7',
          300: '#F49B9B',
          400: '#EC5F5F',
          500: '#E1251B',
          600: '#C81D14',
          700: '#A81811',
          800: '#891512',
          900: '#711514',
        },
        gold: {
          400: '#FCD34D',
          500: '#FBBF24',
          600: '#F59E0B',
        },
        ink: {
          50: '#F7F7F8',
          100: '#EDEEF0',
          200: '#D8DADF',
          300: '#B8BCC4',
          400: '#8B909B',
          500: '#5E6370',
          600: '#404450',
          700: '#2D313C',
          800: '#1F222B',
          900: '#15171E',
          950: '#0C0D12',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        elevation: '0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)',
        focus: '0 0 0 3px rgba(255,107,71,0.35)',
      },
      borderRadius: {
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        shimmer: 'shimmer 1.5s linear infinite',
        'bounce-subtle': 'bounce-subtle 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
