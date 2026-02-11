/** Theme-Konfiguration für eine registrierte Theme */
export interface OpThemeConfig {
  name: string
  components: Record<string, OpComponentTheme>
}

/** Komponentenspezifische Theme-Klassen (Nuxt UI Pattern) */
export interface OpComponentTheme {
  slots: Record<string, string>
  variants?: Record<string, Record<string, Record<string, string>>>
  compoundVariants?: OpCompoundVariant[]
  defaultVariants?: Record<string, string>
}

/** Compound-Variant: Klassen die nur gelten wenn mehrere Variants gleichzeitig matchen */
export interface OpCompoundVariant {
  [key: string]: string | Record<string, string>
  class: Record<string, string>
}

/** Aufgelöste Klassen für eine Komponenten-Instanz */
export type ResolvedClasses = Record<string, string>
