import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        borderStrong: 'hsl(var(--border-strong))',
        input: 'hsl(var(--input))',
        inputHover: 'hsl(var(--input-hover))',
        ring: 'hsl(var(--ring))',
        focus: 'hsl(var(--focus-ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        overlay: 'hsl(var(--overlay))',
        text: {
          primary: 'hsl(var(--text-primary))',
          secondary: 'hsl(var(--text-secondary))',
          muted: 'hsl(var(--text-muted))',
          disabled: 'hsl(var(--text-disabled))',
          inverse: 'hsl(var(--text-inverse))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          hover: 'hsl(var(--primary-hover))',
          soft: 'hsl(var(--primary-soft))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          subtle: 'hsl(var(--surface-subtle))',
          muted: 'hsl(var(--surface-muted))',
          elevated: 'hsl(var(--surface-elevated))',
          hover: 'hsl(var(--surface-hover))'
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          soft: 'hsl(var(--success-soft))',
          foreground: 'hsl(var(--success-foreground))'
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          soft: 'hsl(var(--danger-soft))',
          foreground: 'hsl(var(--danger-foreground))'
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          soft: 'hsl(var(--warning-soft))',
          foreground: 'hsl(var(--warning-foreground))'
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          soft: 'hsl(var(--info-soft))',
          foreground: 'hsl(var(--info-foreground))'
        },
        inventory: {
          DEFAULT: 'hsl(var(--inventory))',
          soft: 'hsl(var(--inventory-soft))',
          foreground: 'hsl(var(--inventory-foreground))'
        }
      },
      borderRadius: {
        full: 'var(--radius-full)',
        xl: 'var(--radius-xl)',
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)'
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        soft: 'var(--shadow-soft)'
      },
      zIndex: {
        sticky: 'var(--z-sticky)',
        dropdown: 'var(--z-dropdown)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)'
      }
    }
  },
  plugins: []
};

export default config;
