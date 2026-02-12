import { z } from 'zod'

/** Known theme names shipped with OpenPress */
export const SUPPORTED_THEMES = ['tailwind-plus', 'material-expressive'] as const
export type SupportedTheme = (typeof SUPPORTED_THEMES)[number]

/** Known locale codes */
export const SUPPORTED_LOCALES = ['en', 'de', 'en-US', 'de-DE'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

/**
 * Zod-Schema für die OpProvider-Konfiguration.
 * Validiert Theme, Locale und Edit-Modus.
 */
export const OpConfigSchema = z.object({
  theme: z.string().default('tailwind-plus'),
  locale: z.string().default('de-DE'),
  editing: z.boolean().default(false),
})

export type OpConfig = z.output<typeof OpConfigSchema>
