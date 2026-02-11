import type { OpComponentTheme } from '@openpress/ui'

/** Tailwind Plus Theme: Image Block (Prose) */
export const image: OpComponentTheme = {
  slots: {
    root: 'relative overflow-hidden',
    img: 'w-full h-auto object-cover rounded-lg',
    caption: 'mt-2 text-sm text-gray-500 dark:text-gray-400 text-center',
  },
  variants: {
    aspect: {
      auto: { img: '' },
      square: { img: 'aspect-square' },
      video: { img: 'aspect-video' },
      wide: { img: 'aspect-[21/9]' },
    },
    rounded: {
      none: { img: 'rounded-none' },
      sm: { img: 'rounded-sm' },
      md: { img: 'rounded-lg' },
      lg: { img: 'rounded-2xl' },
      full: { img: 'rounded-full' },
    },
  },
  defaultVariants: {
    aspect: 'auto',
    rounded: 'md',
  },
}
