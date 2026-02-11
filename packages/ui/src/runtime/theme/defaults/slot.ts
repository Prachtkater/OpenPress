import type { OpComponentTheme } from '../../../types'

/** Standard-Theme-Klassen für OpSlot */
export const slotTheme: OpComponentTheme = {
  slots: {
    root: 'flex flex-col',
    empty: 'min-h-[4rem] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400',
  },
  variants: {
    name: {
      default: { root: 'gap-6' },
      sidebar: { root: 'gap-4' },
      media: { root: 'gap-2' },
      // Liquid Glass Slot Variants
      glass: {
        root: 'gap-6 backdrop-blur-md bg-white/20 dark:bg-gray-900/20 rounded-xl p-6 ring-1 ring-white/30 dark:ring-white/10',
        empty: 'min-h-[4rem] border-2 border-dashed border-white/40 dark:border-white/20 rounded-lg flex items-center justify-center text-gray-400/80 backdrop-blur-sm',
      },
    },
  },
}
