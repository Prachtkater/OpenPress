import type { OpComponentTheme } from '@openpress/ui'

/** Tailwind Plus Theme: Heading Block (Prose) */
export const heading: OpComponentTheme = {
  slots: {
    root: 'font-bold tracking-tight text-gray-900 dark:text-white',
  },
  variants: {
    level: {
      '1': { root: 'text-4xl sm:text-5xl lg:text-6xl leading-tight' },
      '2': { root: 'text-3xl sm:text-4xl leading-snug' },
      '3': { root: 'text-2xl sm:text-3xl leading-snug' },
      '4': { root: 'text-xl sm:text-2xl leading-normal' },
      '5': { root: 'text-lg sm:text-xl leading-normal' },
      '6': { root: 'text-base sm:text-lg leading-normal' },
    },
  },
  defaultVariants: {
    level: '2',
  },
}
