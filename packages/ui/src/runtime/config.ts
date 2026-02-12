import { z } from 'zod'

/** Known theme names shipped with OpenPress */
export const SUPPORTED_THEMES = ['tailwind-plus', 'material-expressive'] as const
export type SupportedTheme = (typeof SUPPORTED_THEMES)[number]

/** Known locale codes */
export const SUPPORTED_LOCALES = ['en', 'de', 'en-US', 'de-DE'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

/** Default display locale for the UI (German-first project) */
export const DEFAULT_DISPLAY_LOCALE = 'de-DE' as const

/** Default theme name */
export const DEFAULT_THEME = 'tailwind-plus' as const

/**
 * Zod-Schema für die OpProvider-Konfiguration.
 * Validiert Theme, Locale und Edit-Modus.
 */
export const OpConfigSchema = z.object({
  theme: z.string().default(DEFAULT_THEME),
  locale: z.string().default(DEFAULT_DISPLAY_LOCALE),
  editing: z.boolean().default(false),
})

export type OpConfig = z.output<typeof OpConfigSchema>
