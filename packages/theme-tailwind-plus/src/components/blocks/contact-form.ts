import type { OpComponentTheme } from '@openpress/ui'

/** Tailwind Plus Theme: Contact Form Block */
export const contactForm: OpComponentTheme = {
  slots: {
    root: 'w-full',
    form: 'flex flex-col gap-6',
    fieldGroup: 'flex flex-col gap-1.5',
    label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
    required: 'text-red-500 ml-0.5',
    input: 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-primary-400 dark:focus:ring-primary-400/20',
    inputError: 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400/20',
    textarea: 'resize-y min-h-[120px]',
    select: 'appearance-none',
    checkboxWrapper: 'flex items-center gap-2',
    checkbox: 'h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800',
    checkboxLabel: 'text-sm text-gray-700 dark:text-gray-300',
    error: 'text-xs text-red-600 dark:text-red-400',
    submitError: 'text-sm text-red-600 dark:text-red-400',
    button: 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-500 dark:hover:bg-primary-400',
    spinner: 'h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent',
    success: 'rounded-lg border border-green-200 bg-green-50 p-6 text-center text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300',
  },
}
