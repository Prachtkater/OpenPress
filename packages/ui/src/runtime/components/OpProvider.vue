<script setup lang="ts">
import { provide, toRef, computed, readonly } from 'vue'
import { PageSchema, SiteConfigSchema, NavigationSchema } from '@openpress/schemas'
import type { Page, SiteConfig, Navigation } from '@openpress/schemas'
import type { OpThemeConfig } from '../../types'
import { OP_PAGE_KEY, OP_SITE_KEY, OP_NAV_KEY, OP_MODE_KEY, OP_THEME_KEY, OP_LOCALE_KEY } from '../keys'
import { resolveTheme } from '../theme/resolve'

const props = defineProps<{
  page: Page
  site: SiteConfig
  navigation?: Navigation
  editing?: boolean
  theme?: string
  locale?: string
}>()

// Zod-Validierung im Development
if (import.meta.dev) {
  const pageResult = PageSchema.safeParse(props.page)
  if (!pageResult.success) {
    console.warn(
      `[OpenPress] OpProvider: Ungültige Page-Daten`,
      pageResult.error.issues,
    )
  }

  const siteResult = SiteConfigSchema.safeParse(props.site)
  if (!siteResult.success) {
    console.warn(
      `[OpenPress] OpProvider: Ungültige SiteConfig-Daten`,
      siteResult.error.issues,
    )
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

const pageRef = toRef(props, 'page')
const navigation = computed<Navigation>(() => props.navigation ?? { main: [], footer: [] })
const mode = computed<'view' | 'edit'>(() => props.editing ? 'edit' : 'view')
const isEditing = computed(() => mode.value === 'edit')
const themeName = computed(() => props.theme ?? props.site.theme ?? 'tailwind-plus')
const resolvedTheme = computed(() => resolveTheme(themeName.value))
const locale = computed(() => props.locale ?? props.site.locale ?? 'de-DE')

// Provide State für Child-Komponenten (Vue provide/inject)
provide(OP_PAGE_KEY as symbol, pageRef)
provide(OP_SITE_KEY as symbol, computed(() => Object.freeze({ ...props.site })))
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
      :site="site"
      :navigation="navigation"
      :mode="mode"
      :is-editing="isEditing"
      :theme="resolvedTheme"
      :locale="locale"
    />
  </div>
</template>
