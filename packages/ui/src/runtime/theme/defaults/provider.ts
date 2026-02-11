import type { OpComponentTheme } from '../../../types'

/** Standard-Theme-Klassen für OpProvider (Liquid Glass Wrapper) */
export const providerTheme: OpComponentTheme = {
  slots: {
    root: 'min-h-screen antialiased',
  },
  variants: {
    mode: {
      view: { root: '' },
      edit: {
        root: 'ring-1 ring-primary-500/20',
      },
    },
  },
}
