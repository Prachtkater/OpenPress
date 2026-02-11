import type { OpComponentTheme } from '@openpress/ui'
import { m3Shape, m3Elevation } from '../../tokens'

/**
 * M3 Expressive — Image Block
 *
 * Images use M3 shape tokens for rounding and elevation for depth.
 * The "Expressive" personality favors medium rounding (rounded-xl).
 *
 * Slots:
 *   root     — outer wrapper (handles spacing/elevation)
 *   image    — the <img> element itself
 *   caption  — optional caption text below
 */
export const image: OpComponentTheme = {
  slots: {
    root: 'overflow-hidden',
    image: `w-full h-auto object-cover ${m3Shape.medium}`,
    caption: `mt-2 text-[var(--md-sys-color-on-surface-variant)] text-[14px] leading-[20px] tracking-[0.25px] font-normal font-[var(--md-sys-typescale-font)]`,
  },
  variants: {
    variant: {
      flat: {
        root: '',
        image: m3Shape.medium,
      },
      elevated: {
        root: m3Elevation.level1,
        image: m3Shape.medium,
      },
      filled: {
        root: `bg-[var(--md-sys-color-surface-container)] p-2 ${m3Shape.medium}`,
        image: m3Shape.small,
      },
    },
  },
  defaultVariants: {
    variant: 'flat',
  },
}
