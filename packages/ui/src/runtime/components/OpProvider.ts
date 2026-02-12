import type { Page, SiteConfig, Navigation } from '@openpress/schemas'
import type { OpThemeConfig } from '../../types'
import { provide } from '../context'
import { DEFAULT_DISPLAY_LOCALE, DEFAULT_THEME } from '../config'
import { OP_PAGE_KEY, OP_SITE_KEY, OP_NAV_KEY, OP_MODE_KEY, OP_THEME_KEY, OP_LOCALE_KEY } from '../keys'
import { resolveTheme } from '../theme/resolve'

export interface OpProviderProps {
  page: Page
  site: SiteConfig
  navigation?: Navigation
  editing?: boolean
  theme?: string
  locale?: string
}

export interface OpProviderState {
  page: Page
  site: Readonly<SiteConfig>
  navigation: Readonly<Navigation>
  mode: 'view' | 'edit'
  theme: Readonly<OpThemeConfig>
  locale: string
  dataAttributes: {
    'data-op-mode': 'view' | 'edit'
    'data-op-theme': string
    'data-op-locale': string
  }
}

/**
 * OpProvider Setup-Logik.
 * Stellt den gesamten globalen State via provide/inject bereit.
 *
 * In einer Vue-Umgebung wird dies in <script setup> aufgerufen.
 * Hier als reine Funktion für Testbarkeit mit Bun.
 */
export function setupOpProvider(props: OpProviderProps): OpProviderState {
  const navigation: Navigation = props.navigation ?? { main: [], footer: [] }
  const mode: 'view' | 'edit' = props.editing ? 'edit' : 'view'
  const themeName = props.theme ?? props.site.theme ?? DEFAULT_THEME
  const resolvedTheme = resolveTheme(themeName)
  const locale = props.locale ?? props.site.locale ?? DEFAULT_DISPLAY_LOCALE

  // Provide State für Child-Komponenten
  provide(OP_PAGE_KEY, props.page)
  provide(OP_SITE_KEY, Object.freeze({ ...props.site }) as Readonly<SiteConfig>)
  provide(OP_NAV_KEY, Object.freeze({ ...navigation }) as Readonly<Navigation>)
  provide(OP_MODE_KEY, mode)
  provide(OP_THEME_KEY, Object.freeze({ ...resolvedTheme }) as Readonly<OpThemeConfig>)
  provide(OP_LOCALE_KEY, locale)

  return {
    page: props.page,
    site: props.site,
    navigation,
    mode,
    theme: resolvedTheme,
    locale,
    dataAttributes: {
      'data-op-mode': mode,
      'data-op-theme': resolvedTheme.name,
      'data-op-locale': locale,
    },
  }
}
