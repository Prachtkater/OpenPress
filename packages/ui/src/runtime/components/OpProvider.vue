<script setup lang="ts">
import { provide, toRef, computed } from 'vue'
import { PageSchema, SiteConfigSchema, NavigationSchema } from '@openpress/schemas'
import type { Page, SiteConfig, Navigation } from '@openpress/schemas'
import type { OpThemeConfig } from '../../types'
import { OP_PAGE_KEY, OP_SITE_KEY, OP_NAV_KEY, OP_MODE_KEY, OP_THEME_KEY, OP_LOCALE_KEY } from '../keys'
import { DEFAULT_DISPLAY_LOCALE, DEFAULT_THEME } from '../config'
import { resolveTheme } from '../theme/resolve'

const DEFAULT_SITE: SiteConfig = {
  name: 'OpenPress',
  locale: DEFAULT_DISPLAY_LOCALE,
  theme: DEFAULT_THEME,
  meta: { title: 'OpenPress', description: '' },
}

const props = defineProps<{
  page?: Page
  site?: SiteConfig
  navigation?: Navigation
  editing?: boolean
  theme?: string
  locale?: string
}>()

// Zod-Validierung im Development
if (import.meta.dev) {
  if (props.page) {
    const pageResult = PageSchema.safeParse(props.page)
    if (!pageResult.success) {
      console.warn(
        `[OpenPress] OpProvider: Ungültige Page-Daten`,
        pageResult.error.issues,
      )
    }
  }

  if (props.site) {
    const siteResult = SiteConfigSchema.safeParse(props.site)
    if (!siteResult.success) {
      console.warn(
        `[OpenPress] OpProvider: Ungültige SiteConfig-Daten`,
        siteResult.error.issues,
      )
    }
  }

  if (props.navigation) {
    const navResult = NavigationSchema.safeParse(props.navigation)
    if (!navResult.success) {
      console.warn(
        `[OpenPress] OpProvider: Ungültige Navigation-Daten`,
        navResult.error.issues,
      )
    }
  }
}

const siteConfig = computed(() => props.site ?? DEFAULT_SITE)
const navigation = computed<Navigation>(() => props.navigation ?? { main: [], footer: [] })
const mode = computed<'view' | 'edit'>(() => props.editing ? 'edit' : 'view')
const isEditing = computed(() => mode.value === 'edit')
const themeName = computed(() => props.theme ?? siteConfig.value.theme ?? DEFAULT_THEME)
const resolvedTheme = computed(() => resolveTheme(themeName.value))
const locale = computed(() => props.locale ?? siteConfig.value.locale ?? DEFAULT_DISPLAY_LOCALE)

// Provide State für Child-Komponenten (Vue provide/inject)
// Always provide page key as a reactive ref so children update when page changes
provide(OP_PAGE_KEY as symbol, toRef(props, 'page'))
provide(OP_SITE_KEY as symbol, computed(() => Object.freeze({ ...siteConfig.value })))
provide(OP_NAV_KEY as symbol, computed(() => Object.freeze({ ...navigation.value })))
provide(OP_MODE_KEY as symbol, mode)
provide(OP_THEME_KEY as symbol, computed(() => Object.freeze({ ...resolvedTheme.value })))
provide(OP_LOCALE_KEY as symbol, locale)
</script>

<template>
  <div
    class="op-provider"
    :data-op-mode="mode"
    :data-op-theme="resolvedTheme.name"
    :data-op-locale="locale"
  >
    <slot
      :page="page"
      :site="siteConfig"
      :navigation="navigation"
      :mode="mode"
      :is-editing="isEditing"
      :theme="resolvedTheme"
      :locale="locale"
    />
  </div>
</template>
