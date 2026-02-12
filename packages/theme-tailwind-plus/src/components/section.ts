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
      // Liquid Glass Variants
      glass: {
        root: 'backdrop-blur-xl bg-white/30 dark:bg-gray-900/30 border-b border-white/20 dark:border-white/10 shadow-lg shadow-black/5',
        inner: 'px-6 py-16 sm:py-20 lg:px-8',
      },
      'glass-hero': {
        root: 'overflow-hidden min-h-[70vh] flex items-center backdrop-blur-2xl bg-gradient-to-br from-white/40 via-white/20 to-transparent dark:from-gray-900/50 dark:via-gray-900/30 dark:to-transparent',
        inner: 'px-6 py-24 sm:py-32 lg:px-8',
      },
      'glass-card': {
        root: 'my-8 mx-4 sm:mx-8 backdrop-blur-lg bg-white/50 dark:bg-gray-900/50 rounded-3xl shadow-2xl shadow-black/5 ring-1 ring-white/30 dark:ring-white/10',
        inner: 'px-8 py-12 sm:px-12 sm:py-16',
      },
      'glass-cta': {
        root: 'backdrop-blur-xl bg-gradient-to-r from-primary-600/80 via-primary-500/70 to-primary-600/80 dark:from-primary-500/60 dark:via-primary-400/50 dark:to-primary-500/60 shadow-lg shadow-primary-500/20',
        inner: 'px-6 py-16 sm:py-20 lg:px-8 text-center text-white',
      },
    },
  },
}
