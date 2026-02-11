export default defineNuxtConfig({
  modules: [
    '@openpress/core',
    '@openpress/feature-contact-form',
    '@openpress/feature-booking',
  ],

  openpress: {
    contentDir: process.env.NUXT_OPENPRESS_CONTENT_DIR || './content',
    editPath: process.env.NUXT_OPENPRESS_EDIT_PATH || '/_edit',
    storage: {
      autoCommit: process.env.NUXT_OPENPRESS_AUTO_COMMIT !== 'false',
    },
  },

  opContactForm: {
    smtpHost: process.env.NUXT_OP_CONTACT_FORM_SMTP_HOST || 'localhost',
    smtpPort: Number(process.env.NUXT_OP_CONTACT_FORM_SMTP_PORT) || 1025,
    notifyTo: process.env.NUXT_OP_CONTACT_FORM_NOTIFY_TO || 'demo@openpress.dev',
    from: process.env.NUXT_OP_CONTACT_FORM_FROM || 'noreply@openpress.dev',
  },

  future: {
    compatibilityVersion: 4,
  },
})
