import type { OpComponentTheme } from '@openpress/ui'
import { m3Typography } from '../../tokens'

/**
 * M3 Expressive — Heading Block
 *
 * Uses M3 type scale for display/headline roles.
 * Level variants map to the M3 hierarchy:
 *   h1 → Display Large, h2 → Display Medium, h3 → Headline Large,
 *   h4 → Headline Medium, h5 → Headline Small, h6 → Title Large
 */
export const heading: OpComponentTheme = {
  slots: {
    root: `text-[var(--md-sys-color-on-surface)] font-[var(--md-sys-typescale-font)]`,
  },
  variants: {
    level: {
      1: { root: m3Typography.displayLarge },
      2: { root: m3Typography.displayMedium },
      3: { root: m3Typography.headlineLarge },
      4: { root: m3Typography.headlineMedium },
      5: { root: m3Typography.headlineSmall },
      6: { root: m3Typography.titleLarge },
    },
  },
  defaultVariants: {
    level: '2',
  },
}
