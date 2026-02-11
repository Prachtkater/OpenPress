import type { OpComponentTheme } from '@openpress/ui'

/** Tailwind Plus Theme: Section-Klassen */
export const section: OpComponentTheme = {
  slots: {
    root: 'relative',
    inner: 'mx-auto max-w-7xl',
  },
  variants: {
    type: {
      hero: {
        root: 'overflow-hidden min-h-[60vh] flex items-center',
        inner: 'px-6 py-24 sm:py-32 lg:px-8',
      },
      features: {
        root: 'bg-gray-50 dark:bg-gray-900/50',
        inner: 'px-6 py-24 sm:py-32 lg:px-8',
      },
      cta: {
        root: 'bg-primary-600 dark:bg-primary-500',
        inner: 'px-6 py-16 sm:py-20 lg:px-8 text-center text-white',
      },
      content: {
        root: '',
        inner: 'px-6 py-16 lg:px-8 prose prose-lg dark:prose-invert mx-auto',
      },
      footer: {
        root: 'bg-gray-900 text-gray-300',
        inner: 'px-6 py-12 lg:px-8',
      },
    },
  },
}
