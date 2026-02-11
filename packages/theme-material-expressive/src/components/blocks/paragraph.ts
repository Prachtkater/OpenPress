import type { OpComponentTheme } from '@openpress/ui'
import { m3Typography } from '../../tokens'

/**
 * M3 Expressive — Paragraph Block
 *
 * Uses M3 Body styles for readable text content.
 * Variants allow size selection: large, medium (default), small.
 */
export const paragraph: OpComponentTheme = {
  slots: {
    root: `text-[var(--md-sys-color-on-surface)] font-[var(--md-sys-typescale-font)] max-w-prose`,
  },
  variants: {
    size: {
      large: { root: m3Typography.bodyLarge },
      medium: { root: m3Typography.bodyMedium },
      small: { root: m3Typography.bodySmall },
    },
  },
  defaultVariants: {
    size: 'large',
  },
}
