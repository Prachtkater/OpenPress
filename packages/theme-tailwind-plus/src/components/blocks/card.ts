import type { OpComponentTheme } from '@openpress/ui'

/**
 * Tailwind Plus Theme: Card Block
 *
 * Supports solid and Liquid Glass variants with dark mode.
 * Slots: root (outer wrapper), header, body, footer, media (image area).
 */
export const card: OpComponentTheme = {
  slots: {
    root: 'relative overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 transition-shadow',
    header: 'px-6 pt-6 pb-0',
    body: 'px-6 py-4 text-gray-700 dark:text-gray-300',
    footer: 'px-6 pb-6 pt-0 flex items-center gap-3',
    media: 'w-full overflow-hidden',
  },
  variants: {
    variant: {
      solid: {
        root: 'shadow-sm hover:shadow-md',
      },
      outline: {
        root: 'border-2 shadow-none',
      },
      elevated: {
        root: 'border-0 shadow-lg hover:shadow-xl',
      },
      glass: {
        root: 'border border-white/20 dark:border-white/10 bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl shadow-lg shadow-black/5 ring-1 ring-white/25 dark:ring-white/10',
      },
      'glass-frosted': {
        root: 'border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl shadow-2xl shadow-black/5 ring-1 ring-white/30 dark:ring-white/10',
      },
    },
    size: {
      sm: {
        root: 'rounded-lg',
        header: 'px-4 pt-4',
        body: 'px-4 py-3 text-sm',
        footer: 'px-4 pb-4',
      },
      md: {
        root: 'rounded-xl',
      },
      lg: {
        root: 'rounded-2xl',
        header: 'px-8 pt-8',
        body: 'px-8 py-5',
        footer: 'px-8 pb-8',
      },
    },
    interactive: {
      true: {
        root: 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
      },
      false: { root: '' },
    },
  },
  compoundVariants: [
    {
      variant: 'glass',
      interactive: 'true',
      class: {
        root: 'hover:bg-white/40 dark:hover:bg-gray-900/40 hover:shadow-xl',
      },
    },
    {
      variant: 'glass-frosted',
      interactive: 'true',
      class: {
        root: 'hover:bg-white/60 dark:hover:bg-gray-900/60 hover:shadow-2xl',
      },
    },
  ],
  defaultVariants: {
    variant: 'solid',
    size: 'md',
    interactive: 'false',
  },
}
