/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': 'var(--primary)',
        'primary-light': 'var(--primary-light)',
        'bg-app': 'var(--bg-app)',
        'bg-card': 'var(--bg-card)',
        'text-main': 'var(--text-main)',
        'text-muted': 'var(--text-muted)',
        'success': 'var(--success)',
        'success-light': 'var(--success-light)',
        'danger': 'var(--danger)',
        'danger-light': 'var(--danger-light)',
        'orange': 'var(--orange)',
        'orange-light': 'var(--orange-light)',
        'purple': 'var(--purple)',
        'purple-light': 'var(--purple-light)',
      },
      borderRadius: {
        'cuida': 'var(--radius)',
      },
      fontSize: {
        'base': 'var(--font-size-base)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}


