import type { OpComponentTheme } from '@openpress/ui'

/**
 * M3 Expressive — Slot Theme
 *
 * Slots use M3 surface-variant for empty state and
 * outline-variant for the dashed border (edit mode).
 */
export const slot: OpComponentTheme = {
  slots: {
    root: 'flex flex-col',
    empty: [
      'min-h-[4rem]',
      'border-2 border-dashed border-[var(--md-sys-color-outline-variant)]',
      'rounded-xl',
      'flex items-center justify-center',
      'text-[var(--md-sys-color-on-surface-variant)]',
      'bg-[var(--md-sys-color-surface-container-low)]',
    ].join(' '),
  },
  variants: {
    name: {
      default: { root: 'gap-6' },
      sidebar: { root: 'gap-4' },
      media: { root: 'gap-2' },
    },
  },
}
