import { defineNuxtModule, createResolver, addServerHandler } from '@nuxt/kit'

export interface MediaOptions {
  driver: 'local' | 'cloudinary'
  local: {
    baseDir: string
    uploadDir: string
  }
}

export default defineNuxtModule<MediaOptions>({
  meta: {
    name: '@openpress/feature-media',
    configKey: 'openpressMedia'
  },
  defaults: {
    driver: 'local',
    local: {
      baseDir: 'public',
      uploadDir: '_openpress/media'
    }
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Register API handlers
    addServerHandler({
      route: '/api/_openpress/media',
      handler: resolver.resolve('./runtime/server/api/media/index.get'),
      method: 'get'
    })
    
    addServerHandler({
      route: '/api/_openpress/media/upload',
      handler: resolver.resolve('./runtime/server/api/media/index.post'),
      method: 'post'
    })

    addServerHandler({
      route: '/api/_openpress/media/:id',
      handler: resolver.resolve('./runtime/server/api/media/[id].delete'),
      method: 'delete'
    })
  }
})
