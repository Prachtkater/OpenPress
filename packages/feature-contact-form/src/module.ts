import {
  defineNuxtModule,
  addServerHandler,
  addComponentsDir,
  addImportsDir,
  createResolver,
} from '@nuxt/kit'

export interface ContactFormModuleOptions {
  /** SMTP Host */
  smtpHost?: string
  /** SMTP Port (default: 587) */
  smtpPort?: number
  /** SMTP Secure (default: false) */
  smtpSecure?: boolean
  /** SMTP User */
  smtpUser?: string
  /** SMTP Password */
  smtpPass?: string
  /** Empfänger der Kontaktanfragen */
  notifyTo?: string
  /** Absender-Adresse */
  from?: string
  /** Bestätigungs-Mail an Absender senden (default: true) */
  sendConfirmation?: boolean
}

export default defineNuxtModule<ContactFormModuleOptions>({
  meta: {
    name: '@openpress/feature-contact-form',
    configKey: 'opContactForm',
    compatibility: { nuxt: '>=3.10.0', bridge: false },
  },
  defaults: {
    smtpPort: 587,
    smtpSecure: false,
    sendConfirmation: true,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // 1. Register OpContactForm component globally
    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      prefix: 'Op',
      global: true,
    })

    // 2. Auto-import composables
    addImportsDir(resolver.resolve('./runtime/composables'))

    // 3. Register server API route for form submission
    addServerHandler({
      route: '/api/_openpress/contact-form/submit',
      handler: resolver.resolve('./runtime/server/api/contact-form.post'),
    })

    // 4. Inject mail config as runtime config
    nuxt.options.runtimeConfig.opContactForm = {
      smtpHost: options.smtpHost ?? '',
      smtpPort: options.smtpPort ?? 587,
      smtpSecure: options.smtpSecure ?? false,
      smtpUser: options.smtpUser ?? '',
      smtpPass: options.smtpPass ?? '',
      notifyTo: options.notifyTo ?? '',
      from: options.from ?? '',
      sendConfirmation: options.sendConfirmation ?? true,
    }
  },
})

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    opContactForm: {
      smtpHost: string
      smtpPort: number
      smtpSecure: boolean
      smtpUser: string
      smtpPass: string
      notifyTo: string
      from: string
      sendConfirmation: boolean
    }
  }
}
