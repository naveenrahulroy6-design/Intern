/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: {
          DEFAULT: 'hsl(var(--input-border))',
          background: 'hsl(var(--input-background))'
        },
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary-background))',
          border: 'hsl(var(--secondary-border))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover-background))',
          border: 'hsl(var(--popover-border))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card-background))',
          border: 'hsl(var(--card-border))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
      },
      borderRadius: {
        xl: `calc(var(--radius) + 4px)`,
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 4px)`,
        sm: `calc(var(--radius) - 6px)`,
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 4px 12px 0 rgba(0,0,0,0.05)',
        'md': '0 6px 16px -3px rgba(0,0,0,0.07)',
        'lg': '0 10px 25px -4px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.08)',
        'xl': '0 20px 40px -10px rgba(0,0,0,0.1), 0 10px 15px -5px rgba(0,0,0,0.08)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        'slide-in-from-right': { from: { transform: 'translateX(1rem)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        'pop-in': { 
          '0%': { transform: 'scale(0.95)', opacity: 0 }, 
          '100%': { transform: 'scale(1)', opacity: 1 } 
        },
        'slide-down-fade': { 
          '0%': { opacity: '0', transform: 'translateY(-10px)' }, 
          '100%': { opacity: '1', transform: 'translateY(0)' } 
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-out': 'fade-out 0.3s ease-in forwards',
        'slide-in-from-right': 'slide-in-from-right 0.3s ease-out forwards',
        'pop-in': 'pop-in 0.3s ease-out forwards',
        'slide-down-fade': 'slide-down-fade 0.3s ease-out forwards',
      }
    }
  },
  plugins: [],
}
