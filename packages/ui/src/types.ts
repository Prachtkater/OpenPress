/** Theme-Konfiguration für eine registrierte Theme */
export interface OpThemeConfig {
  name: string
  components: Record<string, OpComponentTheme>
}

/** Komponentenspezifische Theme-Klassen (Nuxt UI Pattern) */
export interface OpComponentTheme {
  slots: Record<string, string>
  variants?: Record<string, Record<string, Record<string, string>>>
  defaultVariants?: Record<string, string>
}
