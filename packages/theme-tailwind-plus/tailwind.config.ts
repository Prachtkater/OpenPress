import type { Config } from 'tailwindcss'

/**
 * Tailwind Plus — Tailwind CSS v4 Configuration
 *
 * Extends Tailwind with OpenPress design tokens:
 * - Colors mapped to CSS custom properties (light/dark via tokens.css)
 * - Section-level spacing scale
 * - Standard responsive breakpoints
 * - Glass-morphism utilities (backdrop-blur presets)
 */
export default {
  darkMode: 'class',
  content: [],

  theme: {
    extend: {
      // ─── Colors (CSS Custom Properties) ────────────────────
      colors: {
        primary: {
          DEFAULT: 'var(--op-color-primary)',
          light: 'var(--op-color-primary-light)',
          dark: 'var(--op-color-primary-dark)',
        },
        secondary: {
          DEFAULT: 'var(--op-color-secondary)',
          light: 'var(--op-color-secondary-light)',
          dark: 'var(--op-color-secondary-dark)',
        },
        accent: {
          DEFAULT: 'var(--op-color-accent)',
          light: 'var(--op-color-accent-light)',
          dark: 'var(--op-color-accent-dark)',
        },
        surface: {
          DEFAULT: 'var(--op-color-surface)',
          muted: 'var(--op-color-surface-muted)',
          inverse: 'var(--op-color-surface-inverse)',
        },
        on: {
          primary: 'var(--op-color-on-primary)',
          secondary: 'var(--op-color-on-secondary)',
          accent: 'var(--op-color-on-accent)',
          surface: 'var(--op-color-on-surface)',
          'surface-muted': 'var(--op-color-on-surface-muted)',
          success: 'var(--op-color-on-success)',
          warning: 'var(--op-color-on-warning)',
          error: 'var(--op-color-on-error)',
        },
        border: {
          DEFAULT: 'var(--op-color-border)',
          muted: 'var(--op-color-border-muted)',
        },
        success: {
          DEFAULT: 'var(--op-color-success)',
          light: 'var(--op-color-success-light)',
        },
        warning: {
          DEFAULT: 'var(--op-color-warning)',
          light: 'var(--op-color-warning-light)',
        },
        error: {
          DEFAULT: 'var(--op-color-error)',
          light: 'var(--op-color-error-light)',
        },
      },

      // ─── Spacing (Section-Level) ──────────────────────────
      spacing: {
        'section-sm': '2rem',    // py-8
        'section-md': '4rem',    // py-16
        'section-lg': '6rem',    // py-24
        'section-xl': '8rem',    // py-32
        'section-2xl': '10rem',  // py-40
      },

      // ─── Breakpoints (Tailwind v4 Standard) ───────────────
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },

      // ─── Max Width ────────────────────────────────────────
      maxWidth: {
        prose: 'var(--op-prose-max-width)',
      },

      // ─── Box Shadow (Glass-Morphism) ──────────────────────
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.06)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.08)',
        'glass-inset': 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
      },

      // ─── Backdrop Blur (Glass Presets) ────────────────────
      backdropBlur: {
        xs: '2px',
        glass: '12px',
        'glass-lg': '20px',
        'glass-xl': '40px',
      },

      // ─── Border Color / Ring ──────────────────────────────
      ringColor: {
        'glass': 'rgba(255, 255, 255, 0.2)',
        'glass-dark': 'rgba(255, 255, 255, 0.08)',
      },

      // ─── Transition ───────────────────────────────────────
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },

      // ─── Z-Index ──────────────────────────────────────────
      zIndex: {
        'glow-frame': 'var(--op-glow-frame-z)',
      },
    },
  },
} satisfies Config
