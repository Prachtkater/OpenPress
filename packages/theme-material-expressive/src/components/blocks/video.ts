import type { OpComponentTheme } from '@openpress/ui'
import { m3Shape, m3Elevation } from '../../tokens'

/**
 * M3 Expressive — Video Block
 *
 * Videos use M3 shape tokens and surface containers.
 * The player wrapper gets elevation and rounding matching M3.
 *
 * Slots:
 *   root     — outer wrapper
 *   player   — the <video>/<iframe> element container
 *   caption  — optional caption text below
 */
export const video: OpComponentTheme = {
  slots: {
    root: 'overflow-hidden',
    player: `relative w-full aspect-video ${m3Shape.medium} overflow-hidden bg-[var(--md-sys-color-surface-container)]`,
    caption: `mt-2 text-[var(--md-sys-color-on-surface-variant)] text-[14px] leading-[20px] tracking-[0.25px] font-normal font-[var(--md-sys-typescale-font)]`,
  },
  variants: {
    variant: {
      flat: {
        root: '',
        player: m3Shape.medium,
      },
      elevated: {
        root: m3Elevation.level2,
        player: m3Shape.medium,
      },
      filled: {
        root: `bg-[var(--md-sys-color-surface-container)] p-2 ${m3Shape.medium}`,
        player: m3Shape.small,
      },
    },
  },
  defaultVariants: {
    variant: 'flat',
  },
}
