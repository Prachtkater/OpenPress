import {
  defineNuxtModule,
  addServerHandler,
  createResolver,
  addComponentsDir,
  addImportsDir,
  addPlugin,
  useLogger,
} from '@nuxt/kit'
import type { NuxtPage } from '@nuxt/schema'
import { resolveContentType } from './hmr/resolve-content-type'
import { createChangeDebouncer } from './hmr/debounce-changes'
import type { ContentChangePayload } from './hmr/types'
import { discoverFeatures, extractModuleNames, registerFeatures } from './features'
import type { DiscoveredFeature } from './features'

export interface OpenPressStorageOptions {
  repoRoot?: string
  autoCommit: boolean
}

export interface OpenPressOptions {
  /** Path to the content directory (default: './content') */
  contentDir: string
  /** URL prefix for the editor (default: '/_edit') */
  editPath: string
  /** Storage engine configuration */
  storage: OpenPressStorageOptions
}

export default defineNuxtModule<OpenPressOptions>({
  meta: {
    name: '@openpress/core',
    configKey: 'openpress',
    compatibility: { nuxt: '>=3.10.0', bridge: false },
  },
  defaults: {
    contentDir: './content',
    editPath: '/_edit',
    storage: {
      autoCommit: true,
    },
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // 1. Register Op-components globally
    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      prefix: 'Op',
      global: true,
    })

    // 2. Auto-import composables
    addImportsDir(resolver.resolve('./runtime/composables'))

    // 3. Client-side editor plugin
    addPlugin({
      src: resolver.resolve('./runtime/plugins/openpress.client'),
      mode: 'client',
    })

    // 4. Register /_edit routes via pages:extend
    nuxt.hook('pages:extend', (pages: NuxtPage[]) => {
      pages.push(
        {
          name: 'openpress-edit-dashboard',
          path: options.editPath,
          file: resolver.resolve('./runtime/pages/_edit/index.vue'),
        },
        {
          name: 'openpress-edit-page',
          path: `${options.editPath}/:slug(.*)*`,
          file: resolver.resolve('./runtime/pages/_edit/[slug].vue'),
        },
      )
    })

    // 5. Register server API routes
    const apiRoutes = [
      { route: '/api/_openpress/pages', handler: './runtime/server/api/pages/index.get', method: 'get' },
      { route: '/api/_openpress/pages', handler: './runtime/server/api/pages/index.post', method: 'post' },
      { route: '/api/_openpress/pages/:slug', handler: './runtime/server/api/pages/[slug].get', method: 'get' },
      { route: '/api/_openpress/pages/:slug', handler: './runtime/server/api/pages/[slug].put', method: 'put' },
      { route: '/api/_openpress/pages/:slug', handler: './runtime/server/api/pages/[slug].delete', method: 'delete' },
      { route: '/api/_openpress/site', handler: './runtime/server/api/site.get' },
      { route: '/api/_openpress/site', handler: './runtime/server/api/site.put' },
      { route: '/api/_openpress/navigation', handler: './runtime/server/api/navigation.get' },
      { route: '/api/_openpress/navigation', handler: './runtime/server/api/navigation.put' },
      { route: '/api/_openpress/git/commit', handler: './runtime/server/api/git/commit.post' },
      { route: '/api/_openpress/git/history', handler: './runtime/server/api/git/history.get' },
      { route: '/api/_openpress/git/status', handler: './runtime/server/api/git/status.get' },
    ]

    for (const { route, handler } of apiRoutes) {
      addServerHandler({
        route,
        handler: resolver.resolve(handler),
      })
    }

    // 6. HMR for JSON content (dev-only)
    if (nuxt.options.dev) {
      const contentDir = resolver.resolve(nuxt.options.rootDir, options.contentDir)

      // Add content directory to Nuxt's watch scope
      nuxt.options.watch = nuxt.options.watch || []
      nuxt.options.watch.push(contentDir)

      // Register dev-only HMR client plugin
      addPlugin({
        src: resolver.resolve('./runtime/plugins/openpress-hmr.client'),
        mode: 'client',
      })

      // Capture Vite dev server reference for WebSocket access
      // Using inline type to avoid hard dependency on 'vite' package
      let viteServer: { ws: { send: (payload: Record<string, unknown>) => void } } | undefined

      nuxt.hook('vite:serverCreated', (server: typeof viteServer) => {
        viteServer = server
      })

      // Debounced file watcher: batches rapid changes (100ms window)
      const debouncer = createChangeDebouncer((changes: ContentChangePayload[]) => {
        if (!viteServer) return
        for (const change of changes) {
          viteServer.ws.send({
            type: 'custom',
            event: 'openpress:content-change',
            data: change,
          })
        }
      })

      nuxt.hook('builder:watch', (_event: string, relativePath: string) => {
        if (!relativePath.endsWith('.json')) return

        const contentType = resolveContentType(relativePath, options.contentDir)
        if (!contentType) return

        debouncer.add({
          event: _event as ContentChangePayload['event'],
          path: relativePath,
          contentType,
          timestamp: Date.now(),
        })
      })

      // Cleanup on close
      nuxt.hook('close', () => {
        debouncer.dispose()
      })
    }

    // 7. Feature Manifest Discovery
    const logger = useLogger('openpress')
    const moduleNames = extractModuleNames(nuxt.options.modules ?? [])
    const discoveryResult = await discoverFeatures(moduleNames, nuxt.options.rootDir)

    if (discoveryResult.errors.length > 0) {
      for (const err of discoveryResult.errors) {
        logger.warn(`Feature manifest error in ${err.moduleName}: ${err.message}`)
      }
    }

    // Register discovered features in the runtime registry
    registerFeatures(discoveryResult.features)

    if (discoveryResult.features.length > 0) {
      const names = discoveryResult.features.map((f) => f.manifest.label).join(', ')
      logger.info(`Discovered ${discoveryResult.features.length} feature(s): ${names}`)
    }

    // Register feature API route for component picker
    addServerHandler({
      route: '/api/_openpress/features',
      handler: resolver.resolve('./runtime/server/api/features.get'),
    })

    // Inject discovered features as virtual module data for the server
    nuxt.options.runtimeConfig._openpressFeatures = discoveryResult.features.map((f) => ({
      manifest: f.manifest,
      packageDir: f.packageDir,
    }))

    // 8. Runtime configuration
    nuxt.options.runtimeConfig.public.openpress = {
      editPath: options.editPath,
    }

    nuxt.options.runtimeConfig.openpress = {
      contentDir: resolver.resolve(nuxt.options.rootDir, options.contentDir),
      repoRoot: options.storage.repoRoot || nuxt.options.rootDir,
      autoCommit: options.storage.autoCommit,
    }
  },
})

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    openpress: {
      editPath: string
    }
  }
  interface RuntimeConfig {
    openpress: {
      contentDir: string
      repoRoot: string
      autoCommit: boolean
    }
    _openpressFeatures: Array<{
      manifest: import('@openpress/schemas').FeatureManifest
      packageDir: string
    }>
  }
}
