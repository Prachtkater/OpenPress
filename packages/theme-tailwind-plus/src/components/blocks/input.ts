import type { OpComponentTheme } from '@openpress/ui'

/**
 * Tailwind Plus Theme: Input Block
 *
 * Standalone form input styling with focus states and dark mode.
 * Slots: root (wrapper), input, label, helper, error.
 */
export const input: OpComponentTheme = {
  slots: {
    root: 'flex flex-col gap-1.5',
    label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
    input: 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-primary-400 dark:focus:ring-primary-400/20',
    helper: 'text-xs text-gray-500 dark:text-gray-400',
    error: 'text-xs text-red-600 dark:text-red-400',
  },
  variants: {
    size: {
      sm: {
        input: 'px-3 py-1.5 text-xs rounded-md',
        label: 'text-xs',
      },
      md: {
        input: 'px-4 py-2.5 text-sm rounded-lg',
      },
      lg: {
        input: 'px-5 py-3 text-base rounded-xl',
        label: 'text-base',
      },
    },
    state: {
      default: { input: '' },
      error: {
        input: 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400/20',
      },
      success: {
        input: 'border-green-500 focus:border-green-500 focus:ring-green-500/20 dark:border-green-400 dark:focus:border-green-400 dark:focus:ring-green-400/20',
      },
      disabled: {
        input: 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900',
      },
    },
    variant: {
      outline: { input: '' },
      filled: {
        input: 'border-transparent bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800',
      },
      glass: {
        input: 'border-white/20 bg-white/10 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 placeholder:text-gray-400/70',
      },
    },
  },
  defaultVariants: {
    size: 'md',
    state: 'default',
    variant: 'outline',
  },
}
