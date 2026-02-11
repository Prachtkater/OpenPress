import type { OpComponentTheme } from '@openpress/ui'
import { m3Typography, m3Elevation, m3Shape } from '../tokens'

/**
 * M3 Expressive — Section Theme
 *
 * Sections use M3 surface containers for visual hierarchy.
 * The "Expressive" personality favors larger rounding and bolder containers.
 */
export const section: OpComponentTheme = {
  slots: {
    root: 'relative bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] font-[var(--md-sys-typescale-font)]',
    inner: 'mx-auto max-w-7xl',
  },
  variants: {
    type: {
      hero: {
        root: `overflow-hidden min-h-[70vh] flex items-center bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]`,
        inner: 'px-6 py-24 sm:py-32 lg:px-8',
      },
      features: {
        root: `bg-[var(--md-sys-color-surface-container-low)]`,
        inner: 'px-6 py-24 sm:py-32 lg:px-8',
      },
      cta: {
        root: `bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]`,
        inner: 'px-6 py-16 sm:py-20 lg:px-8 text-center',
      },
      content: {
        root: 'bg-[var(--md-sys-color-surface)]',
        inner: `px-6 py-16 lg:px-8 max-w-3xl`,
      },
      footer: {
        root: 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]',
        inner: 'px-6 py-12 lg:px-8',
      },
    },
  },
}
