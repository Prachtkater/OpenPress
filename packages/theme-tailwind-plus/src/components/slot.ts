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
      // Liquid Glass Slot Variants
      glass: {
        root: 'gap-6 backdrop-blur-md bg-white/15 dark:bg-gray-900/15 rounded-2xl p-6 ring-1 ring-white/25 dark:ring-white/10 shadow-lg shadow-black/5',
        empty: 'min-h-[4rem] border-2 border-dashed border-white/30 dark:border-white/15 rounded-xl flex items-center justify-center text-gray-400/70 backdrop-blur-sm',
      },
      'glass-sidebar': {
        root: 'gap-4 backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 rounded-xl p-4 ring-1 ring-white/20 dark:ring-white/5',
      },
    },
  },
}
