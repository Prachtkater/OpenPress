import type { OpComponentTheme } from '@openpress/ui'
import { m3Typography, m3Elevation, m3Shape } from '../../tokens'

/**
 * M3 Expressive — Button Block
 *
 * Follows M3 button specs: Filled, Outlined, Text, Elevated, Tonal.
 * Uses M3 "Expressive" shape (rounded-full for buttons).
 *
 * Slots:
 *   root     — the <button>/<a> wrapper
 *   label    — button text
 *   icon     — optional leading/trailing icon
 */
export const button: OpComponentTheme = {
  slots: {
    root: [
      'inline-flex items-center justify-center gap-2',
      'px-6 h-10',
      m3Shape.full,
      m3Typography.labelLarge,
      'font-[var(--md-sys-typescale-font)]',
      'transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2',
      'disabled:opacity-[0.38] disabled:pointer-events-none',
    ].join(' '),
    label: '',
    icon: 'w-[18px] h-[18px] shrink-0',
  },
  variants: {
    variant: {
      filled: {
        root: `bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] ${m3Elevation.level0} hover:${m3Elevation.level1}`,
      },
      outlined: {
        root: 'bg-transparent text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)]',
      },
      text: {
        root: 'bg-transparent text-[var(--md-sys-color-primary)] px-3',
      },
      elevated: {
        root: `bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-primary)] ${m3Elevation.level1}`,
      },
      tonal: {
        root: 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]',
      },
    },
    size: {
      sm: { root: 'h-8 px-4 text-[12px]' },
      md: { root: 'h-10 px-6' },
      lg: { root: 'h-12 px-8 text-[16px]' },
    },
  },
  defaultVariants: {
    variant: 'filled',
    size: 'md',
  },
}
