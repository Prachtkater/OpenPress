import { refreshNuxtData, navigateTo, useRuntimeConfig } from '#imports'
import type { ContentChangePayload } from '../../hmr/types'

/**
 * Composable for selective cache invalidation triggered by HMR events.
 * Handles page, site config, and navigation content changes.
 */
export function useContentRefresh() {
  async function handleChange(payload: ContentChangePayload): Promise<void> {
    const { contentType, event } = payload

    switch (contentType.type) {
      case 'page':
        await refreshPage(contentType.slug, event)
        break
      case 'site':
        await refreshSiteConfig()
        break
      case 'navigation':
        await refreshNavigation()
        break
    }
  }

  async function refreshPage(slug: string, event: string): Promise<void> {
    if (event === 'unlink') {
      const config = useRuntimeConfig()
      await navigateTo(config.public.openpress.editPath)
      return
    }

    try {
      await refreshNuxtData(`openpress:page:${slug}`)
    } catch (error) {
      console.warn(`[OpenPress HMR] Failed to refresh page '${slug}':`, error)
    }
  }

  async function refreshSiteConfig(): Promise<void> {
    try {
      await refreshNuxtData('openpress:site')
    } catch (error) {
      console.warn('[OpenPress HMR] Failed to refresh site config:', error)
    }
  }

  async function refreshNavigation(): Promise<void> {
    try {
      await refreshNuxtData('openpress:navigation')
    } catch (error) {
      console.warn('[OpenPress HMR] Failed to refresh navigation:', error)
    }
  }

  return { handleChange, refreshPage, refreshSiteConfig, refreshNavigation }
}
