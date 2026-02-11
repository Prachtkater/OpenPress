import type { OpComponentTheme } from '@openpress/ui'
import { m3Shape } from '../../tokens'

/**
 * M3 Expressive — Gallery Block
 */
export const gallery: OpComponentTheme = {
  slots: {
    root: 'w-full',
    grid: 'grid',
    item: `relative overflow-hidden ${m3Shape.medium} transition-all duration-200`,
    image: 'w-full h-full object-cover aspect-square',
    overlay: 'absolute inset-0 bg-black/0 hover:bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200',
    removeBtn: 'absolute top-2 right-2 p-1 bg-white/80 rounded-full shadow-sm hover:bg-white text-gray-800',
    dragHandle: 'cursor-grab active:cursor-grabbing',
  }
}
