export default defineNuxtConfig({
  modules: ['@openpress/core'],

  openpress: {
    contentDir: './content',
    editPath: '/_edit',
    storage: {
      autoCommit: false,
    },
  },

  devtools: { enabled: true },
})
