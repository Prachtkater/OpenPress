import type { OpComponentTheme } from '@openpress/ui'

/** Tailwind Plus Theme: Button Block (Prose) */
export const button: OpComponentTheme = {
  slots: {
    root: 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
  },
  variants: {
    size: {
      sm: { root: 'text-xs gap-1.5 px-3 py-1.5 rounded-md' },
      md: { root: 'text-sm gap-2 px-4 py-2 rounded-lg' },
      lg: { root: 'text-base gap-2.5 px-6 py-3 rounded-lg' },
      xl: { root: 'text-lg gap-3 px-8 py-4 rounded-xl' },
    },
    variant: {
      solid: { root: '' },
      outline: { root: 'border' },
      ghost: { root: '' },
      link: { root: 'underline-offset-4 hover:underline' },
    },
    color: {
      primary: { root: '' },
      secondary: { root: '' },
      neutral: { root: '' },
    },
  },
  compoundVariants: [
    {
      variant: 'solid',
      color: 'primary',
      class: { root: 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400' },
    },
    {
      variant: 'solid',
      color: 'secondary',
      class: { root: 'bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100' },
    },
    {
      variant: 'solid',
      color: 'neutral',
      class: { root: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700' },
    },
    {
      variant: 'outline',
      color: 'primary',
      class: { root: 'border-primary-600 text-primary-600 hover:bg-primary-50 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-950' },
    },
    {
      variant: 'outline',
      color: 'secondary',
      class: { root: 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800' },
    },
    {
      variant: 'outline',
      color: 'neutral',
      class: { root: 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800' },
    },
    {
      variant: 'ghost',
      color: 'primary',
      class: { root: 'text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950' },
    },
    {
      variant: 'ghost',
      color: 'secondary',
      class: { root: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800' },
    },
    {
      variant: 'ghost',
      color: 'neutral',
      class: { root: 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800' },
    },
    {
      variant: 'link',
      color: 'primary',
      class: { root: 'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300' },
    },
    {
      variant: 'link',
      color: 'secondary',
      class: { root: 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100' },
    },
    {
      variant: 'link',
      color: 'neutral',
      class: { root: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200' },
    },
  ],
  defaultVariants: {
    size: 'md',
    variant: 'solid',
    color: 'primary',
  },
}
