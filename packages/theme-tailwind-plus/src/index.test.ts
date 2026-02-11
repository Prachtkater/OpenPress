import { describe, test, expect, beforeEach } from 'bun:test'
import {
  resolveComponentClasses,
  provide,
  clearContext,
  useOpBlockClasses,
  useOpThemeClasses,
  OP_THEME_KEY,
} from '@openpress/ui'
import type { OpThemeConfig } from '@openpress/ui'
import { theme } from './index'
import { section } from './components/section'
import { slot } from './components/slot'
import { heading } from './components/blocks/heading'
import { paragraph } from './components/blocks/paragraph'
import { image } from './components/blocks/image'
import { button } from './components/blocks/button'
import { video } from './components/blocks/video'

// ─── Theme Structure ────────────────────────────────────────────

describe('Tailwind Plus Theme Structure', () => {
  test('exportiert ein gültiges OpThemeConfig', () => {
    expect(theme.name).toBe('tailwind-plus')
    expect(theme.components).toBeDefined()
  })

  test('enthält alle erwarteten Komponenten-Keys', () => {
    const keys = Object.keys(theme.components)
    expect(keys).toContain('section')
    expect(keys).toContain('slot')
    expect(keys).toContain('block:heading')
    expect(keys).toContain('block:paragraph')
    expect(keys).toContain('block:image')
    expect(keys).toContain('block:button')
    expect(keys).toContain('block:video')
  })

  test('alle Komponenten haben mindestens einen Slot', () => {
    for (const [key, comp] of Object.entries(theme.components)) {
      expect(Object.keys(comp.slots).length).toBeGreaterThan(0)
    }
  })
})

// ─── Section Theme ──────────────────────────────────────────────

describe('Section Theme', () => {
  test('hat root und inner Slots', () => {
    expect(section.slots.root).toBeDefined()
    expect(section.slots.inner).toBeDefined()
  })

  test('hat alle Section-Type Variants', () => {
    const types = Object.keys(section.variants!.type)
    expect(types).toContain('hero')
    expect(types).toContain('features')
    expect(types).toContain('cta')
    expect(types).toContain('content')
    expect(types).toContain('footer')
  })

  test('hero Variant erzeugt korrekte Klassen', () => {
    const result = resolveComponentClasses(section, { type: 'hero' })

    expect(result.root).toContain('relative')
    expect(result.root).toContain('overflow-hidden')
    expect(result.root).toContain('min-h-[60vh]')
    expect(result.inner).toContain('mx-auto')
    expect(result.inner).toContain('px-6')
    expect(result.inner).toContain('py-24')
  })

  test('features Variant enthält Background-Klassen', () => {
    const result = resolveComponentClasses(section, { type: 'features' })

    expect(result.root).toContain('bg-gray-50')
    expect(result.root).toContain('dark:bg-gray-900/50')
  })

  test('cta Variant enthält Primary-Background und Text-Center', () => {
    const result = resolveComponentClasses(section, { type: 'cta' })

    expect(result.root).toContain('bg-primary-600')
    expect(result.inner).toContain('text-center')
    expect(result.inner).toContain('text-white')
  })

  test('content Variant enthält Prose-Klassen', () => {
    const result = resolveComponentClasses(section, { type: 'content' })

    expect(result.inner).toContain('prose')
    expect(result.inner).toContain('prose-lg')
    expect(result.inner).toContain('dark:prose-invert')
  })

  test('footer Variant enthält Dark-Background', () => {
    const result = resolveComponentClasses(section, { type: 'footer' })

    expect(result.root).toContain('bg-gray-900')
    expect(result.root).toContain('text-gray-300')
  })

  test('ohne Variant: nur Base-Klassen', () => {
    const result = resolveComponentClasses(section, {})

    expect(result.root).toBe('relative')
    expect(result.inner).toBe('mx-auto max-w-7xl')
  })

  test('Config-Override überschreibt max-width', () => {
    const result = resolveComponentClasses(
      section,
      { type: 'hero' },
      { inner: 'max-w-6xl' },
    )

    expect(result.inner).toContain('max-w-6xl')
    expect(result.inner).not.toContain('max-w-7xl')
  })
})

// ─── Slot Theme ─────────────────────────────────────────────────

describe('Slot Theme', () => {
  test('hat root und empty Slots', () => {
    expect(slot.slots.root).toBeDefined()
    expect(slot.slots.empty).toBeDefined()
  })

  test('default Variant liefert gap-6', () => {
    const result = resolveComponentClasses(slot, { name: 'default' })

    expect(result.root).toContain('flex')
    expect(result.root).toContain('flex-col')
    expect(result.root).toContain('gap-6')
  })

  test('sidebar Variant liefert gap-4', () => {
    const result = resolveComponentClasses(slot, { name: 'sidebar' })

    expect(result.root).toContain('gap-4')
  })

  test('media Variant liefert gap-2', () => {
    const result = resolveComponentClasses(slot, { name: 'media' })

    expect(result.root).toContain('gap-2')
  })

  test('empty Slot enthält border-dashed Styling', () => {
    const result = resolveComponentClasses(slot, {})

    expect(result.empty).toContain('border-2')
    expect(result.empty).toContain('border-dashed')
    expect(result.empty).toContain('rounded-lg')
  })
})

// ─── Heading Block ──────────────────────────────────────────────

describe('Heading Block Theme', () => {
  test('hat root Slot mit Font-Bold und Tracking', () => {
    expect(heading.slots.root).toContain('font-bold')
    expect(heading.slots.root).toContain('tracking-tight')
  })

  test('hat 6 Heading-Levels', () => {
    const levels = Object.keys(heading.variants!.level)
    expect(levels).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  test('Level 1 ist das größte', () => {
    const result = resolveComponentClasses(heading, { level: '1' })
    expect(result.root).toContain('text-4xl')
    expect(result.root).toContain('lg:text-6xl')
  })

  test('Level 6 ist das kleinste', () => {
    const result = resolveComponentClasses(heading, { level: '6' })
    expect(result.root).toContain('text-base')
  })

  test('Default-Variant ist Level 2', () => {
    expect(heading.defaultVariants!.level).toBe('2')
  })

  test('Default-Variant (Level 2) wird korrekt aufgelöst', () => {
    const result = resolveComponentClasses(heading, {})
    expect(result.root).toContain('text-3xl')
  })

  test('Dark-Mode Klassen enthalten', () => {
    expect(heading.slots.root).toContain('dark:text-white')
  })

  test('UI-Override überschreibt Font-Weight', () => {
    const result = resolveComponentClasses(
      heading,
      { level: '1' },
      undefined,
      { root: 'font-extrabold' },
    )

    expect(result.root).toContain('font-extrabold')
    expect(result.root).not.toContain('font-bold')
  })
})

// ─── Paragraph Block ────────────────────────────────────────────

describe('Paragraph Block Theme', () => {
  test('hat root Slot mit Basistext-Klassen', () => {
    expect(paragraph.slots.root).toContain('text-base')
    expect(paragraph.slots.root).toContain('leading-7')
    expect(paragraph.slots.root).toContain('text-gray-700')
  })

  test('hat size Variants (sm, base, lg, xl)', () => {
    const sizes = Object.keys(paragraph.variants!.size)
    expect(sizes).toContain('sm')
    expect(sizes).toContain('base')
    expect(sizes).toContain('lg')
    expect(sizes).toContain('xl')
  })

  test('Default-Variant ist base', () => {
    expect(paragraph.defaultVariants!.size).toBe('base')
  })

  test('sm Variant liefert kleinere Schriftgröße', () => {
    const result = resolveComponentClasses(paragraph, { size: 'sm' })
    expect(result.root).toContain('text-sm')
    expect(result.root).toContain('leading-6')
  })

  test('xl Variant liefert größere Schriftgröße', () => {
    const result = resolveComponentClasses(paragraph, { size: 'xl' })
    expect(result.root).toContain('text-xl')
    expect(result.root).toContain('leading-9')
  })

  test('Dark-Mode Klassen enthalten', () => {
    expect(paragraph.slots.root).toContain('dark:text-gray-300')
  })
})

// ─── Image Block ────────────────────────────────────────────────

describe('Image Block Theme', () => {
  test('hat root, img und caption Slots', () => {
    expect(image.slots.root).toBeDefined()
    expect(image.slots.img).toBeDefined()
    expect(image.slots.caption).toBeDefined()
  })

  test('img Slot enthält object-cover und rounded', () => {
    expect(image.slots.img).toContain('object-cover')
    expect(image.slots.img).toContain('rounded-lg')
    expect(image.slots.img).toContain('w-full')
  })

  test('hat aspect Variants', () => {
    const aspects = Object.keys(image.variants!.aspect)
    expect(aspects).toContain('auto')
    expect(aspects).toContain('square')
    expect(aspects).toContain('video')
    expect(aspects).toContain('wide')
  })

  test('hat rounded Variants', () => {
    const rounded = Object.keys(image.variants!.rounded)
    expect(rounded).toContain('none')
    expect(rounded).toContain('sm')
    expect(rounded).toContain('md')
    expect(rounded).toContain('lg')
    expect(rounded).toContain('full')
  })

  test('square Aspect liefert aspect-square', () => {
    const result = resolveComponentClasses(image, { aspect: 'square' })
    expect(result.img).toContain('aspect-square')
  })

  test('video Aspect liefert aspect-video', () => {
    const result = resolveComponentClasses(image, { aspect: 'video' })
    expect(result.img).toContain('aspect-video')
  })

  test('rounded-full liefert rounded-full', () => {
    const result = resolveComponentClasses(image, { rounded: 'full' })
    expect(result.img).toContain('rounded-full')
    expect(result.img).not.toContain('rounded-lg')
  })

  test('Default: auto aspect, md rounded', () => {
    expect(image.defaultVariants!.aspect).toBe('auto')
    expect(image.defaultVariants!.rounded).toBe('md')
  })

  test('caption Slot hat zentrierten, kleinen Text', () => {
    expect(image.slots.caption).toContain('text-sm')
    expect(image.slots.caption).toContain('text-center')
    expect(image.slots.caption).toContain('text-gray-500')
  })
})

// ─── Button Block ───────────────────────────────────────────────

describe('Button Block Theme', () => {
  test('hat root Slot mit Inline-Flex und Transition', () => {
    expect(button.slots.root).toContain('inline-flex')
    expect(button.slots.root).toContain('items-center')
    expect(button.slots.root).toContain('transition-colors')
    expect(button.slots.root).toContain('font-medium')
  })

  test('hat size Variants (sm, md, lg, xl)', () => {
    const sizes = Object.keys(button.variants!.size)
    expect(sizes).toContain('sm')
    expect(sizes).toContain('md')
    expect(sizes).toContain('lg')
    expect(sizes).toContain('xl')
  })

  test('hat variant Variants (solid, outline, ghost, link)', () => {
    const variants = Object.keys(button.variants!.variant)
    expect(variants).toContain('solid')
    expect(variants).toContain('outline')
    expect(variants).toContain('ghost')
    expect(variants).toContain('link')
  })

  test('hat color Variants (primary, secondary, neutral)', () => {
    const colors = Object.keys(button.variants!.color)
    expect(colors).toContain('primary')
    expect(colors).toContain('secondary')
    expect(colors).toContain('neutral')
  })

  test('Default-Variants: md, solid, primary', () => {
    expect(button.defaultVariants!.size).toBe('md')
    expect(button.defaultVariants!.variant).toBe('solid')
    expect(button.defaultVariants!.color).toBe('primary')
  })

  test('Compound: solid + primary = bg-primary-600', () => {
    const result = resolveComponentClasses(button, {
      variant: 'solid',
      color: 'primary',
      size: 'md',
    })

    expect(result.root).toContain('bg-primary-600')
    expect(result.root).toContain('text-white')
    expect(result.root).toContain('hover:bg-primary-700')
  })

  test('Compound: outline + primary = border-primary', () => {
    const result = resolveComponentClasses(button, {
      variant: 'outline',
      color: 'primary',
      size: 'md',
    })

    expect(result.root).toContain('border-primary-600')
    expect(result.root).toContain('text-primary-600')
    expect(result.root).toContain('border')
  })

  test('Compound: ghost + secondary = text-gray-700', () => {
    const result = resolveComponentClasses(button, {
      variant: 'ghost',
      color: 'secondary',
      size: 'lg',
    })

    expect(result.root).toContain('text-gray-700')
    expect(result.root).toContain('hover:bg-gray-100')
  })

  test('Compound: link + primary = underline Styles', () => {
    const result = resolveComponentClasses(button, {
      variant: 'link',
      color: 'primary',
      size: 'md',
    })

    expect(result.root).toContain('underline-offset-4')
    expect(result.root).toContain('text-primary-600')
  })

  test('Default-Compound wird korrekt aufgelöst (ohne explizite Variants)', () => {
    const result = resolveComponentClasses(button, {})

    // defaultVariants: size=md, variant=solid, color=primary
    expect(result.root).toContain('text-sm')       // size: md
    expect(result.root).toContain('px-4')           // size: md
    expect(result.root).toContain('bg-primary-600') // compound: solid+primary
    expect(result.root).toContain('text-white')     // compound: solid+primary
  })

  test('size xl liefert große Padding-Klassen', () => {
    const result = resolveComponentClasses(button, { size: 'xl' })

    expect(result.root).toContain('text-lg')
    expect(result.root).toContain('px-8')
    expect(result.root).toContain('py-4')
    expect(result.root).toContain('rounded-xl')
  })

  test('Focus-Visible Klassen sind enthalten', () => {
    expect(button.slots.root).toContain('focus-visible:outline-2')
    expect(button.slots.root).toContain('focus-visible:outline-offset-2')
  })
})

// ─── Video Block ────────────────────────────────────────────────

describe('Video Block Theme', () => {
  test('hat root, player, caption, overlay, playButton Slots', () => {
    expect(video.slots.root).toBeDefined()
    expect(video.slots.player).toBeDefined()
    expect(video.slots.caption).toBeDefined()
    expect(video.slots.overlay).toBeDefined()
    expect(video.slots.playButton).toBeDefined()
  })

  test('player Slot hat aspect-video', () => {
    expect(video.slots.player).toContain('aspect-video')
    expect(video.slots.player).toContain('w-full')
  })

  test('overlay Slot hat absolutes Positioning und Hintergrund', () => {
    expect(video.slots.overlay).toContain('absolute')
    expect(video.slots.overlay).toContain('inset-0')
    expect(video.slots.overlay).toContain('bg-black/20')
  })

  test('playButton hat runden Style und Hover-Effekt', () => {
    expect(video.slots.playButton).toContain('rounded-full')
    expect(video.slots.playButton).toContain('hover:scale-105')
    expect(video.slots.playButton).toContain('transition-transform')
  })

  test('hat rounded Variants', () => {
    const rounded = Object.keys(video.variants!.rounded)
    expect(rounded).toContain('none')
    expect(rounded).toContain('sm')
    expect(rounded).toContain('md')
    expect(rounded).toContain('lg')
  })

  test('Default: md rounded', () => {
    expect(video.defaultVariants!.rounded).toBe('md')
  })

  test('rounded lg liefert rounded-2xl', () => {
    const result = resolveComponentClasses(video, { rounded: 'lg' })
    expect(result.root).toContain('rounded-2xl')
  })

  test('caption Slot hat gleichen Style wie Image-Caption', () => {
    expect(video.slots.caption).toContain('text-sm')
    expect(video.slots.caption).toContain('text-center')
    expect(video.slots.caption).toContain('text-gray-500')
  })
})

// ─── Theme via Context (useOpBlockClasses / useOpThemeClasses) ──

describe('Theme via Context Integration', () => {
  beforeEach(() => {
    clearContext()
  })

  test('useOpThemeClasses löst Section-Klassen aus Theme auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpThemeClasses('section', { type: 'hero' })

    expect(classes.root).toContain('relative')
    expect(classes.root).toContain('overflow-hidden')
    expect(classes.inner).toContain('px-6')
  })

  test('useOpThemeClasses löst Slot-Klassen aus Theme auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpThemeClasses('slot', { name: 'sidebar' })

    expect(classes.root).toContain('flex')
    expect(classes.root).toContain('gap-4')
  })

  test('useOpBlockClasses löst Heading-Block Klassen auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses('heading', { level: '1' })

    expect(classes.root).toContain('font-bold')
    expect(classes.root).toContain('text-4xl')
  })

  test('useOpBlockClasses löst Paragraph-Block Klassen auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses('paragraph', { size: 'lg' })

    expect(classes.root).toContain('text-lg')
    expect(classes.root).toContain('leading-8')
  })

  test('useOpBlockClasses löst Image-Block Klassen auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses('image', { aspect: 'square', rounded: 'lg' })

    expect(classes.img).toContain('aspect-square')
    expect(classes.img).toContain('rounded-2xl')
    expect(classes.img).not.toContain('rounded-lg')
  })

  test('useOpBlockClasses löst Button-Block mit CompoundVariants auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses('button', {
      variant: 'outline',
      color: 'secondary',
      size: 'lg',
    })

    expect(classes.root).toContain('border')
    expect(classes.root).toContain('border-gray-300')
    expect(classes.root).toContain('text-base')
    expect(classes.root).toContain('px-6')
  })

  test('useOpBlockClasses löst Video-Block Klassen auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses('video', { rounded: 'none' })

    expect(classes.root).toContain('rounded-none')
    expect(classes.player).toContain('aspect-video')
  })

  test('useOpBlockClasses gibt leere Klassen für unbekannten Block', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses('unknown-block')

    expect(classes).toEqual({})
  })

  test('UI-Override hat höchste Priorität bei Block-Klassen', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses(
      'heading',
      { level: '1' },
      undefined,
      { root: 'text-8xl font-black' },
    )

    expect(classes.root).toContain('font-black')
    expect(classes.root).not.toContain('font-bold')
    expect(classes.root).toContain('text-8xl')
    expect(classes.root).not.toContain('text-4xl')
  })
})

// ─── Tailwind Merge Korrektheit ─────────────────────────────────

describe('Tailwind Merge Korrektheit im Theme', () => {
  test('Image: rounded Override via Config', () => {
    const result = resolveComponentClasses(
      image,
      { aspect: 'auto', rounded: 'md' },
      { img: 'rounded-none' },
    )

    expect(result.img).toContain('rounded-none')
    expect(result.img).not.toContain('rounded-lg')
  })

  test('Button: size Override per UI-Prop', () => {
    const result = resolveComponentClasses(
      button,
      { size: 'md', variant: 'solid', color: 'primary' },
      undefined,
      { root: 'px-12 py-6' },
    )

    expect(result.root).toContain('px-12')
    expect(result.root).toContain('py-6')
    expect(result.root).not.toContain('px-4')
    expect(result.root).not.toContain('py-2')
  })

  test('Section: hero mit komplettem Config-Override', () => {
    const result = resolveComponentClasses(
      section,
      { type: 'hero' },
      { root: 'min-h-screen', inner: 'max-w-5xl px-8' },
    )

    expect(result.root).toContain('min-h-screen')
    expect(result.root).not.toContain('min-h-[60vh]')
    expect(result.inner).toContain('max-w-5xl')
    expect(result.inner).not.toContain('max-w-7xl')
    expect(result.inner).toContain('px-8')
    expect(result.inner).not.toContain('px-6')
  })
})

// ─── Liquid Glass Variants ───────────────────────────────────────

describe('Liquid Glass Section Variants (Tailwind Plus)', () => {
  test('glass Variant enthält backdrop-blur und semi-transparenten Hintergrund', () => {
    const result = resolveComponentClasses(section, { type: 'glass' })

    expect(result.root).toContain('backdrop-blur-xl')
    expect(result.root).toContain('bg-white/30')
    expect(result.root).toContain('border-white/20')
    expect(result.root).toContain('shadow-lg')
  })

  test('glass-hero Variant enthält Gradient-Background', () => {
    const result = resolveComponentClasses(section, { type: 'glass-hero' })

    expect(result.root).toContain('backdrop-blur-2xl')
    expect(result.root).toContain('bg-gradient-to-br')
    expect(result.root).toContain('from-white/40')
    expect(result.root).toContain('via-white/20')
    expect(result.root).toContain('min-h-[70vh]')
  })

  test('glass-card Variant enthält Card-Styling mit Shadow und Ring', () => {
    const result = resolveComponentClasses(section, { type: 'glass-card' })

    expect(result.root).toContain('backdrop-blur-lg')
    expect(result.root).toContain('bg-white/50')
    expect(result.root).toContain('rounded-3xl')
    expect(result.root).toContain('shadow-2xl')
    expect(result.root).toContain('ring-1')
    expect(result.root).toContain('ring-white/30')
  })

  test('glass-cta Variant enthält Gradient Primary-Farbe', () => {
    const result = resolveComponentClasses(section, { type: 'glass-cta' })

    expect(result.root).toContain('backdrop-blur-xl')
    expect(result.root).toContain('bg-gradient-to-r')
    expect(result.root).toContain('from-primary-600/80')
    expect(result.root).toContain('shadow-primary-500/20')
    expect(result.inner).toContain('text-center')
    expect(result.inner).toContain('text-white')
  })

  test('alle Glass-Variants haben Dark-Mode Klassen', () => {
    const glassResult = resolveComponentClasses(section, { type: 'glass' })
    expect(glassResult.root).toContain('dark:bg-gray-900/30')

    const heroResult = resolveComponentClasses(section, { type: 'glass-hero' })
    expect(heroResult.root).toContain('dark:from-gray-900/50')

    const cardResult = resolveComponentClasses(section, { type: 'glass-card' })
    expect(cardResult.root).toContain('dark:bg-gray-900/50')
    expect(cardResult.root).toContain('dark:ring-white/10')

    const ctaResult = resolveComponentClasses(section, { type: 'glass-cta' })
    expect(ctaResult.root).toContain('dark:from-primary-500/60')
  })

  test('Glass-Section Override via UI-Prop', () => {
    const result = resolveComponentClasses(
      section,
      { type: 'glass' },
      undefined,
      { root: 'backdrop-blur-3xl bg-white/60' },
    )

    expect(result.root).toContain('backdrop-blur-3xl')
    expect(result.root).not.toContain('backdrop-blur-xl')
    expect(result.root).toContain('bg-white/60')
  })
})

describe('Liquid Glass Slot Variants (Tailwind Plus)', () => {
  test('glass Slot Variant enthält Glass-Effekte', () => {
    const result = resolveComponentClasses(slot, { name: 'glass' })

    expect(result.root).toContain('backdrop-blur-md')
    expect(result.root).toContain('bg-white/15')
    expect(result.root).toContain('rounded-2xl')
    expect(result.root).toContain('ring-1')
    expect(result.root).toContain('ring-white/25')
    expect(result.root).toContain('shadow-lg')
  })

  test('glass Slot empty hat Glass-Borders', () => {
    const result = resolveComponentClasses(slot, { name: 'glass' })

    expect(result.empty).toContain('border-white/30')
    expect(result.empty).toContain('backdrop-blur-sm')
    expect(result.empty).toContain('rounded-xl')
  })

  test('glass-sidebar Slot Variant mit subtilerem Glass', () => {
    const result = resolveComponentClasses(slot, { name: 'glass-sidebar' })

    expect(result.root).toContain('backdrop-blur-sm')
    expect(result.root).toContain('bg-white/10')
    expect(result.root).toContain('rounded-xl')
    expect(result.root).toContain('gap-4')
  })

  test('glass Slot Dark-Mode Klassen', () => {
    const result = resolveComponentClasses(slot, { name: 'glass' })

    expect(result.root).toContain('dark:bg-gray-900/15')
    expect(result.root).toContain('dark:ring-white/10')
  })
})

// ─── Theme vollständige Glass-Integration ──────────────────────

describe('Theme Glass Integration (via Context)', () => {
  beforeEach(() => {
    clearContext()
  })

  test('useOpThemeClasses löst Glass-Section auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpThemeClasses('section', { type: 'glass-hero' })

    expect(classes.root).toContain('backdrop-blur-2xl')
    expect(classes.root).toContain('bg-gradient-to-br')
    expect(classes.root).toContain('relative')
  })

  test('useOpThemeClasses löst Glass-Card Section auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpThemeClasses('section', { type: 'glass-card' })

    expect(classes.root).toContain('backdrop-blur-lg')
    expect(classes.root).toContain('rounded-3xl')
    expect(classes.root).toContain('shadow-2xl')
  })

  test('useOpThemeClasses löst Glass-Slot auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpThemeClasses('slot', { name: 'glass' })

    expect(classes.root).toContain('backdrop-blur-md')
    expect(classes.root).toContain('ring-white/25')
  })

  test('useOpThemeClasses löst Glass-CTA auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpThemeClasses('section', { type: 'glass-cta' })

    expect(classes.root).toContain('bg-gradient-to-r')
    expect(classes.root).toContain('from-primary-600/80')
    expect(classes.inner).toContain('text-white')
  })
})
