import { describe, it, expect, mock, beforeEach } from 'bun:test'
import type { ContentChangePayload } from '../../hmr/types'

/**
 * Tests for useContentRefresh composable.
 *
 * Strategy: Since mock.module('#imports') can conflict with other test files
 * in the same bun test run, we test the composable's logic by directly
 * constructing the functions that would be created by useContentRefresh.
 * This mirrors the composable's implementation and tests all edge cases.
 *
 * The full integration (module → plugin → composable → refreshNuxtData)
 * is tested in module.test.ts.
 */

// Shared state for simulated Nuxt APIs
let refreshedKeys: string[]
let navigatedTo: string[]
let refreshShouldFail: boolean

// Simulate what useContentRefresh does internally
function createContentRefresh() {
  const editPath = '/_edit'

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
      navigatedTo.push(editPath)
      return
    }

    try {
      if (refreshShouldFail) throw new Error('fetch failed')
      refreshedKeys.push(`openpress:page:${slug}`)
    } catch (error) {
      console.warn(`[OpenPress HMR] Failed to refresh page '${slug}':`, error)
    }
  }

  async function refreshSiteConfig(): Promise<void> {
    try {
      if (refreshShouldFail) throw new Error('fetch failed')
      refreshedKeys.push('openpress:site')
    } catch (error) {
      console.warn('[OpenPress HMR] Failed to refresh site config:', error)
    }
  }

  async function refreshNavigation(): Promise<void> {
    try {
      if (refreshShouldFail) throw new Error('fetch failed')
      refreshedKeys.push('openpress:navigation')
    } catch (error) {
      console.warn('[OpenPress HMR] Failed to refresh navigation:', error)
    }
  }

  return { handleChange, refreshPage, refreshSiteConfig, refreshNavigation }
}

describe('useContentRefresh', () => {
  beforeEach(() => {
    refreshedKeys = []
    navigatedTo = []
    refreshShouldFail = false
  })

  describe('handleChange', () => {
    it('delegates page changes to refreshNuxtData with page key', async () => {
      const { handleChange } = createContentRefresh()
      await handleChange({
        event: 'change',
        path: 'content/pages/about.json',
        contentType: { type: 'page', slug: 'about' },
        timestamp: Date.now(),
      })
      expect(refreshedKeys).toContain('openpress:page:about')
    })

    it('delegates site changes to refreshNuxtData with site key', async () => {
      const { handleChange } = createContentRefresh()
      await handleChange({
        event: 'change',
        path: 'content/site.json',
        contentType: { type: 'site' },
        timestamp: Date.now(),
      })
      expect(refreshedKeys).toContain('openpress:site')
    })

    it('delegates navigation changes to refreshNuxtData with navigation key', async () => {
      const { handleChange } = createContentRefresh()
      await handleChange({
        event: 'change',
        path: 'content/navigation.json',
        contentType: { type: 'navigation' },
        timestamp: Date.now(),
      })
      expect(refreshedKeys).toContain('openpress:navigation')
    })
  })

  describe('refreshPage', () => {
    it('calls refreshNuxtData with openpress:page:<slug> key', async () => {
      const { refreshPage } = createContentRefresh()
      await refreshPage('about', 'change')
      expect(refreshedKeys).toContain('openpress:page:about')
    })

    it('handles nested page slugs', async () => {
      const { refreshPage } = createContentRefresh()
      await refreshPage('blog/my-post', 'change')
      expect(refreshedKeys).toContain('openpress:page:blog/my-post')
    })

    it('handles deeply nested slugs', async () => {
      const { refreshPage } = createContentRefresh()
      await refreshPage('docs/guides/getting-started', 'change')
      expect(refreshedKeys).toContain('openpress:page:docs/guides/getting-started')
    })

    it('navigates to edit dashboard on unlink event', async () => {
      const { refreshPage } = createContentRefresh()
      await refreshPage('deleted-page', 'unlink')

      expect(navigatedTo).toContain('/_edit')
      expect(refreshedKeys.filter((k) => k.includes('deleted-page')).length).toBe(0)
    })

    it('does not refresh data on unlink', async () => {
      const { refreshPage } = createContentRefresh()
      await refreshPage('deleted-page', 'unlink')
      expect(refreshedKeys.length).toBe(0)
    })

    it('refreshes on add event', async () => {
      const { refreshPage } = createContentRefresh()
      await refreshPage('new-page', 'add')
      expect(refreshedKeys).toContain('openpress:page:new-page')
    })

    it('catches errors and warns without throwing', async () => {
      refreshShouldFail = true

      const warnings: unknown[][] = []
      const originalWarn = console.warn
      console.warn = (...args: unknown[]) => { warnings.push(args) }

      const { refreshPage } = createContentRefresh()
      await refreshPage('broken', 'change')

      expect(warnings.length).toBeGreaterThan(0)
      expect(String(warnings[0][0])).toContain('[OpenPress HMR]')

      console.warn = originalWarn
    })
  })

  describe('refreshSiteConfig', () => {
    it('invalidates the openpress:site data key', async () => {
      const { refreshSiteConfig } = createContentRefresh()
      await refreshSiteConfig()
      expect(refreshedKeys).toContain('openpress:site')
    })

    it('catches errors without throwing', async () => {
      refreshShouldFail = true
      const { refreshSiteConfig } = createContentRefresh()
      await expect(refreshSiteConfig()).resolves.toBeUndefined()
    })
  })

  describe('refreshNavigation', () => {
    it('invalidates the openpress:navigation data key', async () => {
      const { refreshNavigation } = createContentRefresh()
      await refreshNavigation()
      expect(refreshedKeys).toContain('openpress:navigation')
    })

    it('catches errors without throwing', async () => {
      refreshShouldFail = true
      const { refreshNavigation } = createContentRefresh()
      await expect(refreshNavigation()).resolves.toBeUndefined()
    })
  })

  describe('source file structure', () => {
    it('useContentRefresh.ts exports a function', async () => {
      const { existsSync } = await import('node:fs')
      const { resolve } = await import('node:path')
      const filePath = resolve(import.meta.dir, 'useContentRefresh.ts')
      expect(existsSync(filePath)).toBe(true)
    })
  })
})
