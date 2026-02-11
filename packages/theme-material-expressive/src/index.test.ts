import { describe, test, expect, beforeEach } from 'bun:test'
import { resolveComponentClasses, clearContext, provide, OP_THEME_KEY, useOpBlockClasses, useOpThemeClasses } from '@openpress/ui'
import type { OpThemeConfig, OpComponentTheme } from '@openpress/ui'
import { theme, css } from './index'
import { section } from './components/section'
import { slot } from './components/slot'
import { heading } from './components/blocks/heading'
import { paragraph } from './components/blocks/paragraph'
import { image } from './components/blocks/image'
import { button } from './components/blocks/button'
import { video } from './components/blocks/video'
import { m3Typography, m3Elevation, m3Shape, m3Motion, m3Colors, m3StateLayer } from './tokens'

// ─── Theme Structure ────────────────────────────────────────────

describe('Material Expressive Theme', () => {
  test('hat den korrekten Theme-Namen', () => {
    expect(theme.name).toBe('material-expressive')
  })

  test('enthält section und slot Komponenten', () => {
    expect(theme.components.section).toBeDefined()
    expect(theme.components.slot).toBeDefined()
  })

  test('enthält alle 5 Block-Typen', () => {
    expect(theme.components['block:heading']).toBeDefined()
    expect(theme.components['block:paragraph']).toBeDefined()
    expect(theme.components['block:image']).toBeDefined()
    expect(theme.components['block:button']).toBeDefined()
    expect(theme.components['block:video']).toBeDefined()
  })

  test('exportiert css Pfad', () => {
    expect(typeof css).toBe('string')
    expect(css).toContain('tokens.css')
  })
})

// ─── M3 Design Tokens ──────────────────────────────────────────

describe('M3 Design Tokens', () => {
  test('m3Colors enthält alle primären Farb-Rollen', () => {
    expect(m3Colors.primary).toContain('--md-sys-color-primary')
    expect(m3Colors.onPrimary).toContain('--md-sys-color-on-primary')
    expect(m3Colors.primaryContainer).toContain('--md-sys-color-primary-container')
    expect(m3Colors.onPrimaryContainer).toContain('--md-sys-color-on-primary-container')
  })

  test('m3Colors enthält Surface-Rollen', () => {
    expect(m3Colors.surface).toContain('--md-sys-color-surface')
    expect(m3Colors.onSurface).toContain('--md-sys-color-on-surface')
    expect(m3Colors.surfaceContainer).toContain('--md-sys-color-surface-container')
    expect(m3Colors.surfaceContainerHigh).toContain('--md-sys-color-surface-container-high')
    expect(m3Colors.surfaceContainerHighest).toContain('--md-sys-color-surface-container-highest')
  })

  test('m3Colors enthält Error-, Outline- und Inverse-Rollen', () => {
    expect(m3Colors.error).toContain('--md-sys-color-error')
    expect(m3Colors.outline).toContain('--md-sys-color-outline')
    expect(m3Colors.inverseSurface).toContain('--md-sys-color-inverse-surface')
  })

  test('m3Typography enthält alle 15 Type-Scale Einträge', () => {
    const entries = Object.keys(m3Typography)
    expect(entries).toHaveLength(15)
    expect(entries).toContain('displayLarge')
    expect(entries).toContain('headlineMedium')
    expect(entries).toContain('bodyLarge')
    expect(entries).toContain('labelSmall')
  })

  test('m3Typography displayLarge hat korrekte M3 Werte', () => {
    expect(m3Typography.displayLarge).toContain('57px')
    expect(m3Typography.displayLarge).toContain('64px')
  })

  test('m3Elevation definiert 6 Level (0-5)', () => {
    expect(Object.keys(m3Elevation)).toHaveLength(6)
    expect(m3Elevation.level0).toBe('')
    expect(m3Elevation.level1).toBe('shadow-sm')
    expect(m3Elevation.level5).toBe('shadow-xl')
  })

  test('m3Shape definiert 7 Shape-Stufen', () => {
    expect(Object.keys(m3Shape)).toHaveLength(7)
    expect(m3Shape.none).toBe('rounded-none')
    expect(m3Shape.medium).toBe('rounded-xl')
    expect(m3Shape.full).toBe('rounded-full')
  })

  test('m3Motion enthält Easing-Kurven und Durations', () => {
    expect(m3Motion.easingStandard).toContain('cubic-bezier')
    expect(m3Motion.easingEmphasized).toContain('cubic-bezier')
    expect(m3Motion.durationMedium2).toBe('300ms')
  })

  test('m3StateLayer enthält Opazitäts-Werte', () => {
    expect(m3StateLayer.hover).toBe('0.08')
    expect(m3StateLayer.focus).toBe('0.10')
    expect(m3StateLayer.pressed).toBe('0.10')
    expect(m3StateLayer.dragged).toBe('0.16')
  })
})

// ─── Section Theme ──────────────────────────────────────────────

describe('Section Theme', () => {
  test('hat root und inner Slots', () => {
    expect(section.slots.root).toBeDefined()
    expect(section.slots.inner).toBeDefined()
  })

  test('root nutzt M3 surface color', () => {
    expect(section.slots.root).toContain('--md-sys-color-surface')
  })

  test('hat type Variants (hero, features, cta, content, footer)', () => {
    const types = Object.keys(section.variants!.type)
    expect(types).toContain('hero')
    expect(types).toContain('features')
    expect(types).toContain('cta')
    expect(types).toContain('content')
    expect(types).toContain('footer')
  })

  test('hero Variant nutzt primary-container', () => {
    const heroRoot = section.variants!.type.hero.root
    expect(heroRoot).toContain('--md-sys-color-primary-container')
  })

  test('cta Variant nutzt primary color', () => {
    const ctaRoot = section.variants!.type.cta.root
    expect(ctaRoot).toContain('--md-sys-color-primary')
  })

  test('hero Variant liefert korrekte Klassen über resolveComponentClasses', () => {
    const result = resolveComponentClasses(section, { type: 'hero' })
    expect(result.root).toContain('min-h-[70vh]')
    expect(result.root).toContain('--md-sys-color-primary-container')
    expect(result.inner).toContain('px-6')
    expect(result.inner).toContain('py-24')
  })
})

// ─── Slot Theme ─────────────────────────────────────────────────

describe('Slot Theme', () => {
  test('hat root und empty Slots', () => {
    expect(slot.slots.root).toBeDefined()
    expect(slot.slots.empty).toBeDefined()
  })

  test('empty Slot nutzt M3 outline-variant für Border', () => {
    expect(slot.slots.empty).toContain('--md-sys-color-outline-variant')
  })

  test('hat name Variants (default, sidebar, media)', () => {
    const names = Object.keys(slot.variants!.name)
    expect(names).toContain('default')
    expect(names).toContain('sidebar')
    expect(names).toContain('media')
  })

  test('default Variant liefert gap-6', () => {
    const result = resolveComponentClasses(slot, { name: 'default' })
    expect(result.root).toContain('gap-6')
  })
})

// ─── Heading Block ──────────────────────────────────────────────

describe('Heading Block', () => {
  test('hat root Slot', () => {
    expect(heading.slots.root).toBeDefined()
  })

  test('nutzt M3 on-surface Farbe', () => {
    expect(heading.slots.root).toContain('--md-sys-color-on-surface')
  })

  test('hat level Variants 1-6', () => {
    const levels = Object.keys(heading.variants!.level)
    expect(levels).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  test('level 1 nutzt displayLarge Typografie', () => {
    expect(heading.variants!.level['1'].root).toBe(m3Typography.displayLarge)
  })

  test('level 3 nutzt headlineLarge Typografie', () => {
    expect(heading.variants!.level['3'].root).toBe(m3Typography.headlineLarge)
  })

  test('defaultVariant ist level 2', () => {
    expect(heading.defaultVariants!.level).toBe('2')
  })

  test('resolve mit level 1 enthält displayLarge Werte', () => {
    const result = resolveComponentClasses(heading, { level: '1' })
    expect(result.root).toContain('57px')
    expect(result.root).toContain('64px')
  })

  test('resolve ohne Variant nutzt defaultVariant (level 2 = displayMedium)', () => {
    const result = resolveComponentClasses(heading, {})
    expect(result.root).toContain('45px')
  })
})

// ─── Paragraph Block ────────────────────────────────────────────

describe('Paragraph Block', () => {
  test('hat root Slot mit max-w-prose', () => {
    expect(paragraph.slots.root).toContain('max-w-prose')
  })

  test('nutzt M3 on-surface Farbe', () => {
    expect(paragraph.slots.root).toContain('--md-sys-color-on-surface')
  })

  test('hat size Variants (large, medium, small)', () => {
    const sizes = Object.keys(paragraph.variants!.size)
    expect(sizes).toContain('large')
    expect(sizes).toContain('medium')
    expect(sizes).toContain('small')
  })

  test('large Variant nutzt bodyLarge Typografie', () => {
    expect(paragraph.variants!.size.large.root).toBe(m3Typography.bodyLarge)
  })

  test('defaultVariant ist size large', () => {
    expect(paragraph.defaultVariants!.size).toBe('large')
  })

  test('resolve mit size small enthält bodySmall Werte', () => {
    const result = resolveComponentClasses(paragraph, { size: 'small' })
    expect(result.root).toContain('12px')
  })
})

// ─── Image Block ────────────────────────────────────────────────

describe('Image Block', () => {
  test('hat root, image und caption Slots', () => {
    expect(image.slots.root).toBeDefined()
    expect(image.slots.image).toBeDefined()
    expect(image.slots.caption).toBeDefined()
  })

  test('image Slot nutzt M3 medium shape', () => {
    expect(image.slots.image).toContain('rounded-xl')
  })

  test('caption nutzt M3 on-surface-variant Farbe', () => {
    expect(image.slots.caption).toContain('--md-sys-color-on-surface-variant')
  })

  test('hat variant Variants (flat, elevated, filled)', () => {
    const variants = Object.keys(image.variants!.variant)
    expect(variants).toContain('flat')
    expect(variants).toContain('elevated')
    expect(variants).toContain('filled')
  })

  test('elevated Variant nutzt Elevation level1', () => {
    expect(image.variants!.variant.elevated.root).toContain('shadow-sm')
  })

  test('filled Variant nutzt surface-container', () => {
    expect(image.variants!.variant.filled.root).toContain('--md-sys-color-surface-container')
  })

  test('defaultVariant ist flat', () => {
    expect(image.defaultVariants!.variant).toBe('flat')
  })
})

// ─── Button Block ───────────────────────────────────────────────

describe('Button Block', () => {
  test('hat root, label und icon Slots', () => {
    expect(button.slots.root).toBeDefined()
    expect(button.slots.label).toBeDefined()
    expect(button.slots.icon).toBeDefined()
  })

  test('root nutzt M3 Expressive shape (rounded-full)', () => {
    expect(button.slots.root).toContain('rounded-full')
  })

  test('root hat Focus-Ring mit M3 primary', () => {
    expect(button.slots.root).toContain('focus-visible:ring-2')
    expect(button.slots.root).toContain('--md-sys-color-primary')
  })

  test('root hat disabled-State', () => {
    expect(button.slots.root).toContain('disabled:opacity-[0.38]')
    expect(button.slots.root).toContain('disabled:pointer-events-none')
  })

  test('hat variant Variants (filled, outlined, text, elevated, tonal)', () => {
    const variants = Object.keys(button.variants!.variant)
    expect(variants).toContain('filled')
    expect(variants).toContain('outlined')
    expect(variants).toContain('text')
    expect(variants).toContain('elevated')
    expect(variants).toContain('tonal')
  })

  test('filled Variant nutzt M3 primary Farben', () => {
    const filled = button.variants!.variant.filled.root
    expect(filled).toContain('--md-sys-color-primary')
    expect(filled).toContain('--md-sys-color-on-primary')
  })

  test('outlined Variant hat border mit outline Farbe', () => {
    const outlined = button.variants!.variant.outlined.root
    expect(outlined).toContain('border')
    expect(outlined).toContain('--md-sys-color-outline')
  })

  test('tonal Variant nutzt secondary-container', () => {
    const tonal = button.variants!.variant.tonal.root
    expect(tonal).toContain('--md-sys-color-secondary-container')
  })

  test('hat size Variants (sm, md, lg)', () => {
    const sizes = Object.keys(button.variants!.size)
    expect(sizes).toContain('sm')
    expect(sizes).toContain('md')
    expect(sizes).toContain('lg')
  })

  test('defaultVariants sind filled + md', () => {
    expect(button.defaultVariants!.variant).toBe('filled')
    expect(button.defaultVariants!.size).toBe('md')
  })

  test('resolve mit variant=outlined + size=lg liefert korrekte Klassen', () => {
    const result = resolveComponentClasses(button, { variant: 'outlined', size: 'lg' })
    expect(result.root).toContain('border')
    expect(result.root).toContain('h-12')
    expect(result.root).toContain('px-8')
  })
})

// ─── Video Block ────────────────────────────────────────────────

describe('Video Block', () => {
  test('hat root, player und caption Slots', () => {
    expect(video.slots.root).toBeDefined()
    expect(video.slots.player).toBeDefined()
    expect(video.slots.caption).toBeDefined()
  })

  test('player Slot nutzt aspect-video für 16:9', () => {
    expect(video.slots.player).toContain('aspect-video')
  })

  test('player nutzt M3 medium shape', () => {
    expect(video.slots.player).toContain('rounded-xl')
  })

  test('caption nutzt M3 on-surface-variant Farbe', () => {
    expect(video.slots.caption).toContain('--md-sys-color-on-surface-variant')
  })

  test('hat variant Variants (flat, elevated, filled)', () => {
    const variants = Object.keys(video.variants!.variant)
    expect(variants).toContain('flat')
    expect(variants).toContain('elevated')
    expect(variants).toContain('filled')
  })

  test('elevated Variant nutzt Elevation level2', () => {
    expect(video.variants!.variant.elevated.root).toContain('shadow')
  })

  test('defaultVariant ist flat', () => {
    expect(video.defaultVariants!.variant).toBe('flat')
  })
})

// ─── Integration mit useOpBlockClasses ──────────────────────────

describe('Integration mit Theme-System', () => {
  beforeEach(() => {
    clearContext()
  })

  test('useOpBlockClasses löst heading-Klassen auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses('heading', { level: '1' })

    expect(classes.root).toContain('57px')
    expect(classes.root).toContain('--md-sys-color-on-surface')
  })

  test('useOpBlockClasses löst button-Klassen mit Variants auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses('button', { variant: 'tonal', size: 'lg' })

    expect(classes.root).toContain('--md-sys-color-secondary-container')
    expect(classes.root).toContain('h-12')
  })

  test('useOpThemeClasses löst section hero-Klassen auf', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpThemeClasses('section', { type: 'hero' })

    expect(classes.root).toContain('min-h-[70vh]')
    expect(classes.inner).toContain('px-6')
  })

  test('useOpBlockClasses mit uiOverrides überschreibt Theme', () => {
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses('paragraph', {}, undefined, { root: 'text-red-500' })

    expect(classes.root).toContain('text-red-500')
    expect(classes.root).toContain('max-w-prose')
  })

  test('useOpBlockClasses ohne Theme-Kontext gibt leere Klassen zurück', () => {
    const classes = useOpBlockClasses('heading')

    expect(classes).toEqual({})
  })

  test('5-Layer Merge funktioniert für M3 button', () => {
    const result = resolveComponentClasses(
      button,
      { variant: 'filled', size: 'md' },
      { root: 'shadow-lg' },
      { root: 'bg-red-500' },
    )

    // ui override bg-red-500 should win over filled bg
    expect(result.root).toContain('bg-red-500')
    // config override shadow-lg should be present
    expect(result.root).toContain('shadow-lg')
    // base rounded-full should survive
    expect(result.root).toContain('rounded-full')
  })
})
