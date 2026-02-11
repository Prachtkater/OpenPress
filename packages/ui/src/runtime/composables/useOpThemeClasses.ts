import type { OpThemeConfig, ResolvedClasses } from '../../types'
import { inject } from '../context'
import { OP_THEME_KEY } from '../keys'
import { resolveComponentClasses } from '../theme/resolve-classes'

type ComponentType = 'section' | 'slot' | 'provider'

/**
 * Löst Theme-Klassen für eine Op-Komponente auf.
 *
 * Nutzt die 5-Layer Merge-Strategie:
 * Theme-Default → Variants → CompoundVariants → app.config Overrides → ui Prop
 *
 * @param component - Komponenten-Typ ('section', 'slot', 'provider')
 * @param activeVariants - Aktive Variant-Werte z.B. { type: 'hero' }
 * @param configOverrides - Overrides aus app.config.ts (op.section, op.slot etc.)
 * @param uiOverrides - Instanz-spezifische Overrides via ui-Prop
 */
export function useOpThemeClasses(
  component: ComponentType | 'block',
  activeVariants?: Record<string, string>,
  configOverrides?: Partial<Record<string, string>>,
  uiOverrides?: Partial<Record<string, string>>,
): ResolvedClasses {
  const theme = inject<Readonly<OpThemeConfig>>(OP_THEME_KEY)

  if (!theme) {
    return {}
  }

  // Theme-Definition für diese Komponente finden
  const componentTheme = theme.components[component]

  if (!componentTheme) {
    return {}
  }

  return resolveComponentClasses(
    componentTheme,
    activeVariants ?? {},
    configOverrides,
    uiOverrides,
  )
}

/**
 * Löst Theme-Klassen für einen Block-Typ auf.
 *
 * Block-Themes werden unter `components['block:${blockType}']` im Theme registriert.
 *
 * @param blockType - Block-Type z.B. 'rich-text', 'image'
 * @param activeVariants - Aktive Variant-Werte
 * @param configOverrides - Overrides aus app.config.ts
 * @param uiOverrides - Instanz-spezifische Overrides via ui-Prop
 */
export function useOpBlockClasses(
  blockType: string,
  activeVariants?: Record<string, string>,
  configOverrides?: Partial<Record<string, string>>,
  uiOverrides?: Partial<Record<string, string>>,
): ResolvedClasses {
  const theme = inject<Readonly<OpThemeConfig>>(OP_THEME_KEY)

  if (!theme) {
    return {}
  }

  const componentTheme = theme.components[`block:${blockType}`]

  if (!componentTheme) {
    return {}
  }

  return resolveComponentClasses(
    componentTheme,
    activeVariants ?? {},
    configOverrides,
    uiOverrides,
  )
}
