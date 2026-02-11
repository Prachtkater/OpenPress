import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { resolve, join } from 'node:path'

// Mock @nuxt/kit functions to capture what the module registers
const addComponentsDirCalls: unknown[] = []
const addImportsDirCalls: unknown[] = []
const addPluginCalls: unknown[] = []
const addServerHandlerCalls: unknown[] = []
const registeredHooks: Record<string, Function[]> = {}

mock.module('@nuxt/kit', () => ({
  defineNuxtModule: (config: any) => config,
  createResolver: (base: string) => ({
    resolve: (...paths: string[]) => resolve(base, ...paths),
  }),
  addComponentsDir: (opts: unknown) => { addComponentsDirCalls.push(opts) },
  addImportsDir: (path: unknown) => { addImportsDirCalls.push(path) },
  addPlugin: (opts: unknown) => { addPluginCalls.push(opts) },
  addServerHandler: (opts: unknown) => { addServerHandlerCalls.push(opts) },
  useLogger: (_tag: string) => ({
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  }),
}))

// Import after mocking
const moduleConfig = await import('./module')
const mod = moduleConfig.default

function createMockNuxt(overrides: Record<string, any> = {}) {
  const hooks: Record<string, Function[]> = {}
  return {
    options: {
      rootDir: '/test/project',
      dev: false,
      modules: [],
      watch: [] as string[],
      runtimeConfig: {
        public: {} as Record<string, any>,
        openpress: {} as Record<string, any>,
      },
      ...overrides,
    },
    hook: (name: string, fn: Function) => {
      hooks[name] = hooks[name] || []
      hooks[name].push(fn)
    },
    callHook: async (name: string, ...args: unknown[]) => {
      for (const fn of hooks[name] || []) {
        await fn(...args)
      }
    },
    _hooks: hooks,
  }
}

function clearCalls() {
  addComponentsDirCalls.length = 0
  addImportsDirCalls.length = 0
  addPluginCalls.length = 0
  addServerHandlerCalls.length = 0
}

describe('@openpress/core module', () => {
  beforeEach(() => {
    clearCalls()
  })

  describe('meta', () => {
    it('has correct module name', () => {
      expect(mod.meta.name).toBe('@openpress/core')
    })

    it('has configKey "openpress"', () => {
      expect(mod.meta.configKey).toBe('openpress')
    })

    it('requires Nuxt >= 3.10.0', () => {
      expect(mod.meta.compatibility).toEqual({
        nuxt: '>=3.10.0',
        bridge: false,
      })
    })
  })

  describe('defaults', () => {
    it('sets contentDir to ./content', () => {
      expect(mod.defaults.contentDir).toBe('./content')
    })

    it('sets editPath to /_edit', () => {
      expect(mod.defaults.editPath).toBe('/_edit')
    })

    it('enables autoCommit by default', () => {
      expect(mod.defaults.storage.autoCommit).toBe(true)
    })
  })

  describe('setup()', () => {
    it('registers components directory with Op prefix', async () => {
      const nuxt = createMockNuxt()
      await mod.setup(mod.defaults, nuxt as any)

      expect(addComponentsDirCalls.length).toBe(1)
      const call = addComponentsDirCalls[0] as any
      expect(call.prefix).toBe('Op')
      expect(call.global).toBe(true)
      expect(call.path).toContain('runtime/components')
    })

    it('registers composables auto-import directory', async () => {
      const nuxt = createMockNuxt()
      await mod.setup(mod.defaults, nuxt as any)

      expect(addImportsDirCalls.length).toBe(1)
      expect(addImportsDirCalls[0]).toContain('runtime/composables')
    })

    it('registers client plugin', async () => {
      const nuxt = createMockNuxt()
      await mod.setup(mod.defaults, nuxt as any)

      expect(addPluginCalls.length).toBe(1)
      const call = addPluginCalls[0] as any
      expect(call.mode).toBe('client')
      expect(call.src).toContain('runtime/plugins/openpress.client')
    })

    it('registers pages:extend hook', async () => {
      const nuxt = createMockNuxt()
      await mod.setup(mod.defaults, nuxt as any)

      expect(nuxt._hooks['pages:extend']).toBeDefined()
      expect(nuxt._hooks['pages:extend'].length).toBe(1)
    })

    it('injects /_edit dashboard and page routes', async () => {
      const nuxt = createMockNuxt()
      await mod.setup(mod.defaults, nuxt as any)

      const pages: any[] = []
      nuxt._hooks['pages:extend'][0](pages)

      expect(pages.length).toBe(2)

      const dashboard = pages.find((p: any) => p.name === 'openpress-edit-dashboard')
      expect(dashboard).toBeDefined()
      expect(dashboard.path).toBe('/_edit')
      expect(dashboard.file).toContain('runtime/pages/_edit/index.vue')

      const pageEditor = pages.find((p: any) => p.name === 'openpress-edit-page')
      expect(pageEditor).toBeDefined()
      expect(pageEditor.path).toBe('/_edit/:slug(.*)*')
      expect(pageEditor.file).toContain('runtime/pages/_edit/[slug].vue')
    })

    it('supports custom editPath for routes', async () => {
      const nuxt = createMockNuxt()
      const options = { ...mod.defaults, editPath: '/admin' }
      await mod.setup(options, nuxt as any)

      const pages: any[] = []
      nuxt._hooks['pages:extend'][0](pages)

      expect(pages[0].path).toBe('/admin')
      expect(pages[1].path).toBe('/admin/:slug(.*)*')
    })

    it('registers all 12 server API handlers (11 core + 1 features)', async () => {
      const nuxt = createMockNuxt()
      await mod.setup(mod.defaults, nuxt as any)

      expect(addServerHandlerCalls.length).toBe(12)
    })

    it('registers pages API routes', async () => {
      const nuxt = createMockNuxt()
      await mod.setup(mod.defaults, nuxt as any)

      const routes = addServerHandlerCalls.map((c: any) => c.route)
      expect(routes).toContain('/api/_openpress/pages')
      expect(routes).toContain('/api/_openpress/pages/:slug')
    })

    it('registers site API routes', async () => {
      const nuxt = createMockNuxt()
      await mod.setup(mod.defaults, nuxt as any)

      const routes = addServerHandlerCalls.map((c: any) => c.route)
      expect(routes.filter((r: string) => r === '/api/_openpress/site').length).toBe(2)
    })

    it('registers navigation API routes', async () => {
      const nuxt = createMockNuxt()
      await mod.setup(mod.defaults, nuxt as any)

      const routes = addServerHandlerCalls.map((c: any) => c.route)
      expect(routes.filter((r: string) => r === '/api/_openpress/navigation').length).toBe(2)
    })

    it('registers git API routes', async () => {
      const nuxt = createMockNuxt()
      await mod.setup(mod.defaults, nuxt as any)

      const routes = addServerHandlerCalls.map((c: any) => c.route)
      expect(routes).toContain('/api/_openpress/git/commit')
      expect(routes).toContain('/api/_openpress/git/history')
      expect(routes).toContain('/api/_openpress/git/status')
    })

    it('sets public runtime config with editPath', async () => {
      const nuxt = createMockNuxt()
      await mod.setup(mod.defaults, nuxt as any)

      expect(nuxt.options.runtimeConfig.public.openpress).toEqual({
        editPath: '/_edit',
      })
    })

    it('sets private runtime config with storage settings', async () => {
      const nuxt = createMockNuxt()
      await mod.setup(mod.defaults, nuxt as any)

      const config = nuxt.options.runtimeConfig.openpress as any
      expect(config.contentDir).toContain('content')
      expect(config.repoRoot).toBe('/test/project')
      expect(config.autoCommit).toBe(true)
    })

    it('uses custom repoRoot when provided', async () => {
      const nuxt = createMockNuxt()
      const options = {
        ...mod.defaults,
        storage: { autoCommit: false, repoRoot: '/custom/repo' },
      }
      await mod.setup(options, nuxt as any)

      const config = nuxt.options.runtimeConfig.openpress as any
      expect(config.repoRoot).toBe('/custom/repo')
      expect(config.autoCommit).toBe(false)
    })

    it('resolves server handler paths correctly', async () => {
      const nuxt = createMockNuxt()
      await mod.setup(mod.defaults, nuxt as any)

      for (const call of addServerHandlerCalls) {
        const handler = (call as any).handler
        expect(handler).toContain('runtime/server/api/')
      }
    })
  })

  describe('HMR integration (dev mode)', () => {
    it('does not register HMR hooks in production mode', async () => {
      const nuxt = createMockNuxt({ dev: false })
      await mod.setup(mod.defaults, nuxt as any)

      expect(nuxt._hooks['builder:watch']).toBeUndefined()
      expect(nuxt._hooks['vite:serverCreated']).toBeUndefined()
      expect(nuxt._hooks['close']).toBeUndefined()
    })

    it('registers HMR hooks in dev mode', async () => {
      const nuxt = createMockNuxt({ dev: true })
      await mod.setup(mod.defaults, nuxt as any)

      expect(nuxt._hooks['builder:watch']).toBeDefined()
      expect(nuxt._hooks['vite:serverCreated']).toBeDefined()
      expect(nuxt._hooks['close']).toBeDefined()
    })

    it('adds content directory to watch scope in dev mode', async () => {
      const nuxt = createMockNuxt({ dev: true })
      await mod.setup(mod.defaults, nuxt as any)

      expect(nuxt.options.watch.some((p: string) => p.includes('content'))).toBe(true)
    })

    it('registers HMR client plugin in dev mode', async () => {
      const nuxt = createMockNuxt({ dev: true })
      await mod.setup(mod.defaults, nuxt as any)

      const hmrPlugin = addPluginCalls.find(
        (c: any) => c.src.includes('openpress-hmr.client')
      )
      expect(hmrPlugin).toBeDefined()
      expect((hmrPlugin as any).mode).toBe('client')
    })

    it('does not register HMR client plugin in production', async () => {
      const nuxt = createMockNuxt({ dev: false })
      await mod.setup(mod.defaults, nuxt as any)

      const hmrPlugin = addPluginCalls.find(
        (c: any) => c.src.includes('openpress-hmr.client')
      )
      expect(hmrPlugin).toBeUndefined()
    })

    it('sends WebSocket events for JSON content changes', async () => {
      const nuxt = createMockNuxt({ dev: true })
      await mod.setup(mod.defaults, nuxt as any)

      // Simulate Vite server with mock WebSocket
      const sentMessages: unknown[] = []
      const mockViteServer = {
        ws: {
          send: (msg: unknown) => { sentMessages.push(msg) },
        },
      }
      await nuxt.callHook('vite:serverCreated', mockViteServer)

      // Simulate a file change
      await nuxt.callHook('builder:watch', 'change', 'content/pages/about.json')

      // Wait for debounce (default 100ms)
      await new Promise((r) => setTimeout(r, 150))

      expect(sentMessages.length).toBe(1)
      const msg = sentMessages[0] as any
      expect(msg.type).toBe('custom')
      expect(msg.event).toBe('openpress:content-change')
      expect(msg.data.contentType).toEqual({ type: 'page', slug: 'about' })
      expect(msg.data.event).toBe('change')
    })

    it('ignores non-JSON file changes', async () => {
      const nuxt = createMockNuxt({ dev: true })
      await mod.setup(mod.defaults, nuxt as any)

      const sentMessages: unknown[] = []
      const mockViteServer = {
        ws: { send: (msg: unknown) => { sentMessages.push(msg) } },
      }
      await nuxt.callHook('vite:serverCreated', mockViteServer)

      await nuxt.callHook('builder:watch', 'change', 'content/pages/about.vue')
      await new Promise((r) => setTimeout(r, 150))

      expect(sentMessages.length).toBe(0)
    })

    it('ignores JSON files outside content directory', async () => {
      const nuxt = createMockNuxt({ dev: true })
      await mod.setup(mod.defaults, nuxt as any)

      const sentMessages: unknown[] = []
      const mockViteServer = {
        ws: { send: (msg: unknown) => { sentMessages.push(msg) } },
      }
      await nuxt.callHook('vite:serverCreated', mockViteServer)

      await nuxt.callHook('builder:watch', 'change', 'src/config.json')
      await new Promise((r) => setTimeout(r, 150))

      expect(sentMessages.length).toBe(0)
    })

    it('debounces rapid changes to the same file', async () => {
      const nuxt = createMockNuxt({ dev: true })
      await mod.setup(mod.defaults, nuxt as any)

      const sentMessages: unknown[] = []
      const mockViteServer = {
        ws: { send: (msg: unknown) => { sentMessages.push(msg) } },
      }
      await nuxt.callHook('vite:serverCreated', mockViteServer)

      // Rapid changes to same file
      await nuxt.callHook('builder:watch', 'change', 'content/pages/about.json')
      await nuxt.callHook('builder:watch', 'change', 'content/pages/about.json')
      await nuxt.callHook('builder:watch', 'change', 'content/pages/about.json')

      await new Promise((r) => setTimeout(r, 150))

      // Should send only 1 message (deduplicated by path)
      expect(sentMessages.length).toBe(1)
    })

    it('batches changes to different files within debounce window', async () => {
      const nuxt = createMockNuxt({ dev: true })
      await mod.setup(mod.defaults, nuxt as any)

      const sentMessages: unknown[] = []
      const mockViteServer = {
        ws: { send: (msg: unknown) => { sentMessages.push(msg) } },
      }
      await nuxt.callHook('vite:serverCreated', mockViteServer)

      await nuxt.callHook('builder:watch', 'change', 'content/pages/about.json')
      await nuxt.callHook('builder:watch', 'change', 'content/site.json')
      await nuxt.callHook('builder:watch', 'change', 'content/navigation.json')

      await new Promise((r) => setTimeout(r, 150))

      // All 3 distinct files get their own message
      expect(sentMessages.length).toBe(3)
    })

    it('does not send messages before Vite server is ready', async () => {
      const nuxt = createMockNuxt({ dev: true })
      await mod.setup(mod.defaults, nuxt as any)

      // Trigger change without registering Vite server
      await nuxt.callHook('builder:watch', 'change', 'content/pages/about.json')
      await new Promise((r) => setTimeout(r, 150))

      // No crash, just silently ignored
    })
  })

  describe('runtime file structure', () => {
    it('has all required component files', async () => {
      const { existsSync } = await import('node:fs')
      const base = resolve(import.meta.dir, 'runtime/components')
      expect(existsSync(join(base, 'OpSection.vue'))).toBe(true)
      expect(existsSync(join(base, 'OpSlot.vue'))).toBe(true)
      expect(existsSync(join(base, 'OpBlock.vue'))).toBe(true)
      expect(existsSync(join(base, 'OpEditFrame.vue'))).toBe(true)
    })

    it('has all required composable files', async () => {
      const { existsSync } = await import('node:fs')
      const base = resolve(import.meta.dir, 'runtime/composables')
      expect(existsSync(join(base, 'useOpenPress.ts'))).toBe(true)
      expect(existsSync(join(base, 'useEditor.ts'))).toBe(true)
      expect(existsSync(join(base, 'usePage.ts'))).toBe(true)
      expect(existsSync(join(base, 'useContentRefresh.ts'))).toBe(true)
    })

    it('has all required page files', async () => {
      const { existsSync } = await import('node:fs')
      const base = resolve(import.meta.dir, 'runtime/pages/_edit')
      expect(existsSync(join(base, 'index.vue'))).toBe(true)
      expect(existsSync(join(base, '[slug].vue'))).toBe(true)
    })

    it('has client plugin file', async () => {
      const { existsSync } = await import('node:fs')
      const base = resolve(import.meta.dir, 'runtime/plugins')
      expect(existsSync(join(base, 'openpress.client.ts'))).toBe(true)
      expect(existsSync(join(base, 'openpress-hmr.client.ts'))).toBe(true)
    })

    it('has HMR utility files', async () => {
      const { existsSync } = await import('node:fs')
      const base = resolve(import.meta.dir, 'hmr')
      expect(existsSync(join(base, 'types.ts'))).toBe(true)
      expect(existsSync(join(base, 'resolve-content-type.ts'))).toBe(true)
      expect(existsSync(join(base, 'debounce-changes.ts'))).toBe(true)
      expect(existsSync(join(base, 'index.ts'))).toBe(true)
    })

    it('has all required server API handler files', async () => {
      const { existsSync } = await import('node:fs')
      const base = resolve(import.meta.dir, 'runtime/server/api')

      const expectedFiles = [
        'pages/index.get.ts',
        'pages/[slug].get.ts',
        'pages/[slug].put.ts',
        'pages/[slug].delete.ts',
        'site.get.ts',
        'site.put.ts',
        'navigation.get.ts',
        'navigation.put.ts',
        'git/commit.post.ts',
        'git/history.get.ts',
        'git/status.get.ts',
      ]

      for (const file of expectedFiles) {
        expect(existsSync(join(base, file))).toBe(true)
      }
    })
  })
})
