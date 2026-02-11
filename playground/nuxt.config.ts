export default defineNuxtConfig({
  modules: [
    '@openpress/core',
    '@openpress/feature-contact-form',
    '@openpress/feature-booking',
    '../packages/feature-media/src/module',
  ],

  openpress: {
    contentDir: './content',
    editPath: '/_edit',
    storage: {
      autoCommit: false,
    },
  },

  opContactForm: {
    smtpHost: 'localhost',
    smtpPort: 1025,
    notifyTo: 'demo@openpress.dev',
    from: 'noreply@openpress.dev',
  },

  devtools: { enabled: true },
})
