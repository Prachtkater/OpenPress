export default defineNuxtConfig({
  extends: ['@nuxt/ui-pro'],
  modules: [
    '@nuxt/content',
    '@nuxt/ui',
    '@nuxtjs/fontaine',
    '@nuxtjs/google-fonts',
    'nuxt-og-image'
  ],
  ui: {
    icons: ['heroicons', 'simple-icons']
  },
  content: {
    highlight: {
      theme: {
        default: 'github-light',
        dark: 'github-dark'
      }
    }
  },
  routeRules: {
    '/api/search.json': { prerender: true }
  },
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4
  }
})
