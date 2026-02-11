import type { OpComponentTheme } from '@openpress/ui'

/** Tailwind Plus Theme: Paragraph Block (Prose) */
export const paragraph: OpComponentTheme = {
  slots: {
    root: 'text-base leading-7 text-gray-700 dark:text-gray-300',
  },
  variants: {
    size: {
      sm: { root: 'text-sm leading-6' },
      base: { root: 'text-base leading-7' },
      lg: { root: 'text-lg leading-8' },
      xl: { root: 'text-xl leading-9' },
    },
  },
  defaultVariants: {
    size: 'base',
  },
}
