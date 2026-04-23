/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A5F',
        'primary-light': '#2E5D9E',
        'primary-soft': '#E9F1FB',
        accent: '#F0A500',
        surface: '#F8F9FC',
        'surface-strong': '#EEF3F7',
        card: '#FFFFFF',
        border: '#E5E7EB',
        'text-primary': '#1A1D23',
        'text-secondary': '#6B7280',
        success: '#10B981',
        'success-soft': '#E8F8F0',
        warning: '#F59E0B',
        'warning-soft': '#FFF4D9',
        danger: '#EF4444',
        'danger-soft': '#FDECEC',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 10px 30px -18px rgba(26, 29, 35, 0.18)',
        soft: '0 6px 18px -14px rgba(30, 58, 95, 0.24)',
      },
      width: {
        sidebar: '260px',
      },
      height: {
        topbar: '64px',
      },
    },
  },
  plugins: [],
};
