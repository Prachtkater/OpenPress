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
    },
  },
}
