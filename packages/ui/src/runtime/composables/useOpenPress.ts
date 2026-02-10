import type { Page, SiteConfig, Navigation } from '@openpress/schemas'
import type { OpThemeConfig } from '../../types'
import { inject } from '../context'
import { OP_PAGE_KEY, OP_SITE_KEY, OP_NAV_KEY, OP_MODE_KEY, OP_THEME_KEY } from '../keys'

export interface UseOpenPressReturn {
  page: Page
  site: Readonly<SiteConfig>
  navigation: Readonly<Navigation>
  mode: 'view' | 'edit'
  isEditing: boolean
  theme: Readonly<OpThemeConfig>
}

/**
 * Hauptcomposable für den Zugriff auf den gesamten OpenPress-State.
 * Muss innerhalb eines OpProvider-Kontexts aufgerufen werden.
 */
export function useOpenPress(): UseOpenPressReturn {
  const page = inject<Page>(OP_PAGE_KEY)
  const site = inject<Readonly<SiteConfig>>(OP_SITE_KEY)
  const navigation = inject<Readonly<Navigation>>(OP_NAV_KEY)
  const mode = inject<'view' | 'edit'>(OP_MODE_KEY)
  const theme = inject<Readonly<OpThemeConfig>>(OP_THEME_KEY)

  if (!page || !site) {
    throw new Error(
      '[OpenPress] useOpenPress() muss innerhalb von <OpProvider> aufgerufen werden.'
    )
  }

  return {
    page,
    site,
    navigation: navigation ?? { main: [], footer: [] },
    mode: mode ?? 'view',
    isEditing: mode === 'edit',
    theme: theme ?? { name: 'tailwind-plus', components: {} },
  }
}
