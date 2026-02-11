import type { OpThemeConfig } from '@openpress/ui'
import { section } from './components/section'
import { slot } from './components/slot'
import { heading } from './components/blocks/heading'
import { paragraph } from './components/blocks/paragraph'
import { image } from './components/blocks/image'
import { button } from './components/blocks/button'
import { video } from './components/blocks/video'
import { gallery } from './components/blocks/gallery'
import { contactForm } from './components/blocks/contact-form'

/**
 * Material Design 3 Expressive Theme for OpenPress
 *
 * Implements Google's M3 "Expressive" design personality with:
 * - Dynamic Color system (CSS custom properties)
 * - M3 Type Scale (Display, Headline, Title, Body, Label)
 * - M3 Elevation levels (shadow + surface tint)
 * - M3 Shape scale (extra-small to full rounding)
 * - M3 Motion tokens (emphasized easing curves)
 *
 * Block components use `block:${type}` keys in the theme registry.
 */
export const theme: OpThemeConfig = {
  name: 'material-expressive',
  components: {
    section,
    slot,
    'block:heading': heading,
    'block:paragraph': paragraph,
    'block:image': image,
    'block:button': button,
    'block:video': video,
    'block:gallery': gallery,
    'block:contact-form': contactForm,
  },
}

/** CSS tokens path for Nuxt module integration */
export const css = new URL('./tokens.css', import.meta.url).pathname

// Re-export tokens for consumers
export {
  m3Colors,
  m3Typography,
  m3Elevation,
  m3Shape,
  m3Motion,
  m3StateLayer,
} from './tokens'

export type {
  M3Typography,
  M3Elevation,
  M3Shape,
  M3Motion,
} from './tokens'
