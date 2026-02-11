import type { OpComponentTheme } from '@openpress/ui'

/** Tailwind Plus Theme: Video Block (Prose) */
export const video: OpComponentTheme = {
  slots: {
    root: 'relative overflow-hidden rounded-lg',
    player: 'w-full aspect-video',
    caption: 'mt-2 text-sm text-gray-500 dark:text-gray-400 text-center',
    overlay: 'absolute inset-0 flex items-center justify-center bg-black/20',
    playButton: 'w-16 h-16 rounded-full bg-white/90 dark:bg-gray-900/90 flex items-center justify-center shadow-lg hover:scale-105 transition-transform',
  },
  variants: {
    rounded: {
      none: { root: 'rounded-none' },
      sm: { root: 'rounded-sm' },
      md: { root: 'rounded-lg' },
      lg: { root: 'rounded-2xl' },
    },
  },
  defaultVariants: {
    rounded: 'md',
  },
}
