import type { OpThemeConfig } from '../../../types'
import { providerTheme } from './provider'
import { sectionTheme } from './section'
import { slotTheme } from './slot'

/** Standard-Theme mit Basis-Klassen für alle Op-Komponenten */
export const defaultTheme: OpThemeConfig = {
  name: 'default',
  components: {
    provider: providerTheme,
    section: sectionTheme,
    slot: slotTheme,
  },
}

export { providerTheme, sectionTheme, slotTheme }
