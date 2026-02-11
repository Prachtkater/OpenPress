import { twMerge } from 'tailwind-merge'
import type { OpComponentTheme, ResolvedClasses } from '../../types'

/**
 * Löst die finalen Klassen für eine Komponente auf.
 *
 * Merge-Reihenfolge (Priorität aufsteigend):
 * 1. Theme-Default (slots) — Basis-Klassen aus dem Theme
 * 2. Theme-Variants — Klassen basierend auf aktiven Variants
 * 3. Theme-CompoundVariants — Klassen wenn mehrere Variants matchen
 * 4. app.config.ts Overrides — Globale User-Overrides
 * 5. ui Prop — Instanz-spezifische Overrides
 */
export function resolveComponentClasses(
  theme: OpComponentTheme,
  activeVariants: Record<string, string>,
  configOverrides?: Partial<Record<string, string>>,
  uiOverrides?: Partial<Record<string, string>>,
): ResolvedClasses {
  const slotNames = Object.keys(theme.slots)
  const result: ResolvedClasses = {}

  for (const slot of slotNames) {
    const layers: string[] = []

    // Layer 1: Base Slot Klassen
    if (theme.slots[slot]) {
      layers.push(theme.slots[slot])
    }

    // Layer 2: Variant Klassen
    if (theme.variants) {
      const merged = { ...theme.defaultVariants, ...activeVariants }

      for (const [variantName, variantValue] of Object.entries(merged)) {
        const variantClasses = theme.variants[variantName]?.[variantValue]?.[slot]
        if (variantClasses) {
          layers.push(variantClasses)
        }
      }
    }

    // Layer 3: Compound Variants
    if (theme.compoundVariants) {
      const mergedVariants = { ...theme.defaultVariants, ...activeVariants }

      for (const compound of theme.compoundVariants) {
        const conditions = Object.entries(compound).filter(([key]) => key !== 'class')
        const allMatch = conditions.every(
          ([key, value]) => mergedVariants[key] === value,
        )
        if (allMatch && compound.class[slot]) {
          layers.push(compound.class[slot])
        }
      }
    }

    // Layer 4: app.config.ts Overrides
    if (configOverrides?.[slot]) {
      layers.push(configOverrides[slot]!)
    }

    // Layer 5: ui Prop Overrides
    if (uiOverrides?.[slot]) {
      layers.push(uiOverrides[slot]!)
    }

    // Merge alle Layers mit tailwind-merge
    result[slot] = twMerge(...layers)
  }

  return result
}
