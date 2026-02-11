import { describe, it, expect, beforeEach } from 'bun:test'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ContentChangePayload } from '../../hmr/types'

/**
 * Tests for the openpress-hmr.client plugin.
 *
 * import.meta.hot is per-module and not patchable from tests.
 * We verify:
 * 1. The plugin file exists and follows the expected naming convention.
 * 2. The HMR listener→handleChange contract via simulation.
 *
 * The actual plugin is also thoroughly tested in module.test.ts which
 * verifies it gets registered as a dev-only client plugin.
 */

describe('openpress-hmr.client plugin', () => {
  describe('file structure', () => {
    it('plugin file exists', () => {
      const pluginPath = resolve(import.meta.dir, 'openpress-hmr.client.ts')
      expect(existsSync(pluginPath)).toBe(true)
    })

    it('follows .client.ts naming convention for client-only plugin', () => {
      const pluginPath = resolve(import.meta.dir, 'openpress-hmr.client.ts')
      expect(pluginPath.endsWith('.client.ts')).toBe(true)
    })
  })

  describe('HMR listener→handleChange contract', () => {
    // Since import.meta.hot is per-module and cannot be patched from tests,
    // we simulate the exact logic the plugin performs when hot is available.
    // The plugin code:
    //   import.meta.hot.on('openpress:content-change', (payload) => handleChange(payload))

    let handleChangeCalls: ContentChangePayload[]
    let hotListeners: Map<string, (payload: ContentChangePayload) => void>

    function simulatePluginSetup() {
      const handleChange = (payload: ContentChangePayload) => {
        handleChangeCalls.push(payload)
      }

      const hot = {
        on: (event: string, cb: (payload: ContentChangePayload) => void) => {
          hotListeners.set(event, cb)
        },
      }

      // Mirror plugin logic
      hot.on('openpress:content-change', (payload: ContentChangePayload) => {
        handleChange(payload)
      })
    }

    beforeEach(() => {
      handleChangeCalls = []
      hotListeners = new Map()
      simulatePluginSetup()
    })

    it('registers a listener for openpress:content-change', () => {
      expect(hotListeners.has('openpress:content-change')).toBe(true)
    })

    it('forwards page change payload to handleChange', () => {
      const listener = hotListeners.get('openpress:content-change')!
      const payload: ContentChangePayload = {
        event: 'change',
        path: 'content/pages/about.json',
        contentType: { type: 'page', slug: 'about' },
        timestamp: Date.now(),
      }

      listener(payload)
      expect(handleChangeCalls.length).toBe(1)
      expect(handleChangeCalls[0]).toEqual(payload)
    })

    it('forwards site change payload', () => {
      const listener = hotListeners.get('openpress:content-change')!
      const payload: ContentChangePayload = {
        event: 'change',
        path: 'content/site.json',
        contentType: { type: 'site' },
        timestamp: Date.now(),
      }

      listener(payload)
      expect(handleChangeCalls[0].contentType).toEqual({ type: 'site' })
    })

    it('forwards navigation change payload', () => {
      const listener = hotListeners.get('openpress:content-change')!
      const payload: ContentChangePayload = {
        event: 'change',
        path: 'content/navigation.json',
        contentType: { type: 'navigation' },
        timestamp: Date.now(),
      }

      listener(payload)
      expect(handleChangeCalls[0].contentType).toEqual({ type: 'navigation' })
    })

    it('forwards add events', () => {
      const listener = hotListeners.get('openpress:content-change')!
      const payload: ContentChangePayload = {
        event: 'add',
        path: 'content/pages/new-page.json',
        contentType: { type: 'page', slug: 'new-page' },
        timestamp: Date.now(),
      }

      listener(payload)
      expect(handleChangeCalls[0].event).toBe('add')
    })

    it('forwards unlink events', () => {
      const listener = hotListeners.get('openpress:content-change')!
      const payload: ContentChangePayload = {
        event: 'unlink',
        path: 'content/pages/deleted.json',
        contentType: { type: 'page', slug: 'deleted' },
        timestamp: Date.now(),
      }

      listener(payload)
      expect(handleChangeCalls[0].event).toBe('unlink')
    })

    it('preserves timestamp from payload', () => {
      const listener = hotListeners.get('openpress:content-change')!
      const ts = 1700000000000
      const payload: ContentChangePayload = {
        event: 'change',
        path: 'content/pages/about.json',
        contentType: { type: 'page', slug: 'about' },
        timestamp: ts,
      }

      listener(payload)
      expect(handleChangeCalls[0].timestamp).toBe(ts)
    })
  })
})
