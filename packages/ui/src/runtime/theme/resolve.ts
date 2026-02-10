import type { OpThemeConfig } from '../../types'

/** Registry für async Theme-Loader */
const themeRegistry = new Map<string, () => Promise<OpThemeConfig>>()

/** Cache für bereits aufgelöste Themes */
const resolvedCache = new Map<string, OpThemeConfig>()

/** Registriert ein Theme mit einem Lazy-Loader */
export function registerTheme(name: string, loader: () => Promise<OpThemeConfig>): void {
  themeRegistry.set(name, loader)
}

/**
 * Löst ein Theme synchron auf (für SSR).
 * Gibt ein leeres Default-Theme zurück, wenn das Theme nicht im Cache ist.
 */
export function resolveTheme(name: string): OpThemeConfig {
  return resolvedCache.get(name) ?? { name, components: {} }
}

/**
 * Lädt ein Theme async und cached das Ergebnis.
 * Für Client-seitige Theme-Resolution nach dem Hydration.
 */
export async function loadTheme(name: string): Promise<OpThemeConfig> {
  const cached = resolvedCache.get(name)
  if (cached) return cached

  const loader = themeRegistry.get(name)
  if (!loader) {
    const fallback: OpThemeConfig = { name, components: {} }
    resolvedCache.set(name, fallback)
    return fallback
  }

  const theme = await loader()
  resolvedCache.set(name, theme)
  return theme
}

/** Setzt die Theme-Registry und den Cache zurück (für Tests) */
export function clearThemeRegistry(): void {
  themeRegistry.clear()
  resolvedCache.clear()
}
