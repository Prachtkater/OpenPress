import { DEFAULT_LOCALE, type LocalizedString } from '@openpress/schemas'
import type { OpThemeConfig } from '../../types'
import { inject } from '../context'
import { OP_MODE_KEY, OP_THEME_KEY, OP_LOCALE_KEY } from '../keys'

export interface UseOpProviderReturn {
  theme: Readonly<OpThemeConfig>
  themeName: string
  locale: string
  mode: 'view' | 'edit'
  isEditing: boolean
  /** Resolves a LocalizedString to the current locale (fallback: en) */
  resolve: (str: LocalizedString) => string
}

/**
 * Composable für den Zugriff auf OpProvider-Konfiguration.
 * Gibt Theme, Locale und Mode zurück — ohne Page/Navigation.
 * Muss innerhalb eines OpProvider-Kontexts aufgerufen werden.
 */
export function useOpProvider(): UseOpProviderReturn {
  const theme = inject<Readonly<OpThemeConfig>>(OP_THEME_KEY)
  const locale = inject<string>(OP_LOCALE_KEY)
  const mode = inject<'view' | 'edit'>(OP_MODE_KEY)

  if (theme === undefined || locale === undefined || mode === undefined) {
    throw new Error(
      '[OpenPress] useOpProvider() muss innerhalb von <OpProvider> aufgerufen werden.'
    )
  }

  const lang = locale.split('-')[0]

  return {
    theme,
    themeName: theme.name,
    locale,
    mode,
    isEditing: mode === 'edit',
    resolve: (str: LocalizedString) => {
      const value = str[lang] ?? str[DEFAULT_LOCALE]
      return value ?? ''
    },
  }
}
