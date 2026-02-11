import type { OpThemeConfig } from '@openpress/ui'
import { section } from './components/section'
import { slot } from './components/slot'
import { heading } from './components/blocks/heading'
import { paragraph } from './components/blocks/paragraph'
import { image } from './components/blocks/image'
import { button } from './components/blocks/button'
import { video } from './components/blocks/video'
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
    'block:contact-form': contactForm,
  },
}

// Re-export der Einzelkomponenten
export { section } from './components/section'
export { slot } from './components/slot'
export { heading } from './components/blocks/heading'
export { paragraph } from './components/blocks/paragraph'
export { image } from './components/blocks/image'
export { button } from './components/blocks/button'
export { video } from './components/blocks/video'
export { contactForm } from './components/blocks/contact-form'
