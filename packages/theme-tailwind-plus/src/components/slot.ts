import type { OpComponentTheme } from '@openpress/ui'

/** Tailwind Plus Theme: Slot-Klassen */
export const slot: OpComponentTheme = {
  slots: {
    root: 'flex flex-col',
    empty: 'min-h-[4rem] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500',
  },
  variants: {
    name: {
      default: { root: 'gap-6' },
      sidebar: { root: 'gap-4' },
      media: { root: 'gap-2' },
    },
  },
}
