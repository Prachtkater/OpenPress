import type { OpThemeConfig } from '@openpress/ui'
import { section } from './components/section'
import { slot } from './components/slot'
import { heading } from './components/blocks/heading'
import { paragraph } from './components/blocks/paragraph'
import { image } from './components/blocks/image'
import { button } from './components/blocks/button'
import { video } from './components/blocks/video'
import { card } from './components/blocks/card'
import { input } from './components/blocks/input'
import { contactForm } from './components/blocks/contact-form'

/**
 * Tailwind Plus Theme für OpenPress.
 *
 * Block-Keys folgen dem `block:${type}` Pattern aus useOpBlockClasses.
 */
export const theme: OpThemeConfig = {
  name: 'tailwind-plus',
  components: {
    section,
    slot,
    'block:heading': heading,
    'block:paragraph': paragraph,
    'block:image': image,
    'block:button': button,
    'block:video': video,
    'block:card': card,
    'block:input': input,
    'block:contact-form': contactForm,
  },
}

/** CSS tokens path for Nuxt module integration */
export const css = new URL('./tokens.css', import.meta.url).pathname

// Re-export tokens for consumers
export {
  tpColors,
  tpBreakpoints,
  tpSpacing,
  tpTypography,
  tpElevation,
  tpRadius,
  tpTransition,
} from './tokens'

export type {
  TpColors,
  TpBreakpoints,
  TpSpacing,
  TpTypography,
  TpElevation,
  TpRadius,
  TpTransition,
} from './tokens'

// Re-export der Einzelkomponenten
export { section } from './components/section'
export { slot } from './components/slot'
export { heading } from './components/blocks/heading'
export { paragraph } from './components/blocks/paragraph'
export { image } from './components/blocks/image'
export { button } from './components/blocks/button'
export { video } from './components/blocks/video'
export { card } from './components/blocks/card'
export { input } from './components/blocks/input'
export { contactForm } from './components/blocks/contact-form'

// ─── Nuxt Plugin ────────────────────────────────────────────────
// Registers the Tailwind Plus theme in the @openpress/ui theme registry
// so that OpProvider can resolve it by name.

/**
 * Creates a Nuxt plugin that registers the Tailwind Plus theme.
 *
 * Usage in nuxt.config.ts or as a plugin:
 * ```ts
 * import { createTailwindPlusPlugin } from '@openpress/theme-tailwind-plus'
 * export default defineNuxtPlugin(createTailwindPlusPlugin())
 * ```
 *
 * Or use the pre-built `plugin` export directly:
 * ```ts
 * // plugins/theme.ts
 * export { plugin as default } from '@openpress/theme-tailwind-plus'
 * ```
 */
export function createTailwindPlusPlugin() {
  return async () => {
    const { registerTheme, loadTheme } = await import('@openpress/ui')
    registerTheme('tailwind-plus', async () => theme)
    await loadTheme('tailwind-plus')
  }
}

/**
 * Pre-built Nuxt plugin for direct use.
 *
 * Registers and pre-loads the Tailwind Plus theme into the
 * @openpress/ui theme registry, making it available to OpProvider.
 */
export const plugin = createTailwindPlusPlugin()
