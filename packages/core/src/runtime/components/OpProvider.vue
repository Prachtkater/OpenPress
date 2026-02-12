<script setup lang="ts">
import { provide, toRef, computed } from 'vue'
import { PageSchema, SiteConfigSchema, NavigationSchema } from '@openpress/schemas'
import type { Page, SiteConfig, Navigation } from '@openpress/schemas'
import {
  OP_PAGE_KEY,
  OP_SITE_KEY,
  OP_NAV_KEY,
  OP_MODE_KEY,
  OP_THEME_KEY,
  resolveTheme,
} from '@openpress/ui'

const props = defineProps<{
  page: Page
  site: SiteConfig
  navigation?: Navigation
  editing?: boolean
  theme?: string
}>()

if (import.meta.dev) {
  const pageResult = PageSchema.safeParse(props.page)
  if (!pageResult.success) {
    console.warn(
      `[OpenPress] OpProvider: Invalid page data`,
      pageResult.error.issues,
    )
  }

  const siteResult = SiteConfigSchema.safeParse(props.site)
  if (!siteResult.success) {
    console.warn(
      `[OpenPress] OpProvider: Invalid site config`,
      siteResult.error.issues,
    )
  }

  if (props.navigation) {
    const navResult = NavigationSchema.safeParse(props.navigation)
    if (!navResult.success) {
      console.warn(
        `[OpenPress] OpProvider: Invalid navigation data`,
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

provide(OP_PAGE_KEY as symbol, pageRef)
provide(OP_SITE_KEY as symbol, computed(() => Object.freeze({ ...props.site })))
provide(OP_NAV_KEY as symbol, computed(() => Object.freeze({ ...navigation.value })))
provide(OP_MODE_KEY as symbol, mode)
provide(OP_THEME_KEY as symbol, computed(() => Object.freeze({ ...resolvedTheme.value })))
</script>

<template>
  <div
    class="op-provider"
    :data-op-mode="mode"
    :data-op-theme="resolvedTheme.name"
  >
    <slot
      :page="page"
      :site="site"
      :navigation="navigation"
      :mode="mode"
      :is-editing="isEditing"
      :theme="resolvedTheme"
    />
  </div>
</template>
