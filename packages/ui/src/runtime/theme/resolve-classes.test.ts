import { describe, test, expect, beforeEach } from 'bun:test'
import { resolveComponentClasses } from './resolve-classes'
import { clearContext, provide } from '../context'
import { OP_THEME_KEY } from '../keys'
import { useOpThemeClasses, useOpBlockClasses } from '../composables/useOpThemeClasses'
import type { OpComponentTheme, OpThemeConfig } from '../../types'
import { sectionTheme, slotTheme } from './defaults'

// ─── resolveComponentClasses ────────────────────────────────────

describe('resolveComponentClasses', () => {
  test('Base Slots: gibt nur Basis-Klassen ohne Variants zurück', () => {
    const theme: OpComponentTheme = {
      slots: {
        root: 'relative bg-white',
        inner: 'mx-auto max-w-7xl',
      },
    }

    const result = resolveComponentClasses(theme, {})

    expect(result.root).toBe('relative bg-white')
    expect(result.inner).toBe('mx-auto max-w-7xl')
  })

  test('Single Variant: type "hero" liefert korrekte Klassen', () => {
    const theme: OpComponentTheme = {
      slots: {
        root: 'relative',
        inner: 'mx-auto max-w-7xl',
      },
      variants: {
        type: {
          hero: {
            root: 'overflow-hidden min-h-[60vh]',
            inner: 'px-6 py-24',
          },
        },
      },
    }

    const result = resolveComponentClasses(theme, { type: 'hero' })

    expect(result.root).toBe('relative overflow-hidden min-h-[60vh]')
    expect(result.inner).toBe('mx-auto max-w-7xl px-6 py-24')
  })

  test('Default Variants: defaultVariants werden angewendet', () => {
    const theme: OpComponentTheme = {
      slots: {
        root: 'base',
      },
      variants: {
        size: {
          sm: { root: 'text-sm' },
          md: { root: 'text-base' },
          lg: { root: 'text-lg' },
        },
      },
      defaultVariants: {
        size: 'md',
      },
    }

    const result = resolveComponentClasses(theme, {})

    expect(result.root).toBe('base text-base')
  })

  test('Variant Override: aktive Variants überschreiben Defaults', () => {
    const theme: OpComponentTheme = {
      slots: {
        root: 'base',
      },
      variants: {
        size: {
          sm: { root: 'text-sm' },
          md: { root: 'text-base' },
          lg: { root: 'text-lg' },
        },
      },
      defaultVariants: {
        size: 'md',
      },
    }

    const result = resolveComponentClasses(theme, { size: 'lg' })

    expect(result.root).toBe('base text-lg')
  })

  test('Compound Variants: alle Conditions matchen → Klassen angewendet', () => {
    const theme: OpComponentTheme = {
      slots: {
        root: 'base',
      },
      variants: {
        color: {
          primary: { root: '' },
          secondary: { root: '' },
        },
        variant: {
          solid: { root: '' },
          outline: { root: '' },
        },
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class: { root: 'bg-blue-600 text-white' },
        },
      ],
    }

    const result = resolveComponentClasses(theme, { color: 'primary', variant: 'solid' })

    expect(result.root).toBe('base bg-blue-600 text-white')
  })

  test('Compound No-Match: nicht alle Conditions → kein Match', () => {
    const theme: OpComponentTheme = {
      slots: {
        root: 'base',
      },
      variants: {
        color: {
          primary: { root: '' },
          secondary: { root: '' },
        },
        variant: {
          solid: { root: '' },
          outline: { root: '' },
        },
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class: { root: 'bg-blue-600 text-white' },
        },
      ],
    }

    const result = resolveComponentClasses(theme, { color: 'primary', variant: 'outline' })

    expect(result.root).toBe('base')
  })

  test('Config Override: app.config.ts Werte überschreiben Theme', () => {
    const theme: OpComponentTheme = {
      slots: {
        root: 'relative',
        inner: 'mx-auto max-w-7xl',
      },
    }

    const result = resolveComponentClasses(
      theme,
      {},
      { inner: 'max-w-6xl' },
    )

    expect(result.root).toBe('relative')
    expect(result.inner).toBe('mx-auto max-w-6xl')
  })

  test('UI Prop Override: ui Prop überschreibt alles', () => {
    const theme: OpComponentTheme = {
      slots: {
        root: 'relative bg-white',
        inner: 'mx-auto max-w-7xl',
      },
    }

    const result = resolveComponentClasses(
      theme,
      {},
      { root: 'bg-gray-100' },          // config override
      { root: 'bg-black text-white' },   // ui prop (höchste Prio)
    )

    expect(result.root).toBe('relative bg-black text-white')
    expect(result.inner).toBe('mx-auto max-w-7xl')
  })

  test('Tailwind Merge: konfligierende Klassen werden korrekt gemerged', () => {
    const theme: OpComponentTheme = {
      slots: {
        root: 'px-6 py-24 text-sm',
      },
      variants: {
        type: {
          hero: { root: 'px-8' },
        },
      },
    }

    const result = resolveComponentClasses(
      theme,
      { type: 'hero' },
      undefined,
      { root: 'py-16' },
    )

    // px-6 → px-8 (variant), py-24 → py-16 (ui prop), text-sm bleibt
    expect(result.root).toBe('text-sm px-8 py-16')
  })

  test('Empty Theme: fehlende Slots → leere Klassen', () => {
    const theme: OpComponentTheme = {
      slots: {},
    }

    const result = resolveComponentClasses(theme, { type: 'hero' })

    expect(result).toEqual({})
  })

  test('Full 5-Layer Merge: Theme base + Variant + Compound + Config + UI', () => {
    const theme: OpComponentTheme = {
      slots: {
        root: 'relative',
        inner: 'mx-auto max-w-7xl',
      },
      variants: {
        type: {
          hero: {
            root: 'min-h-[60vh]',
            inner: 'px-6 py-24',
          },
        },
        color: {
          primary: { root: '' },
        },
      },
      compoundVariants: [
        {
          type: 'hero',
          color: 'primary',
          class: { root: 'bg-primary-600' },
        },
      ],
    }

    const result = resolveComponentClasses(
      theme,
      { type: 'hero', color: 'primary' },
      { inner: 'max-w-6xl' },
      { root: 'bg-black' },
    )

    // root: "relative" + "min-h-[60vh]" + "bg-primary-600" + "bg-black" (ui wins)
    expect(result.root).toBe('relative min-h-[60vh] bg-black')
    // inner: "mx-auto max-w-7xl" + "px-6 py-24" + "max-w-6xl" (config wins)
    expect(result.inner).toBe('mx-auto px-6 py-24 max-w-6xl')
  })
})

// ─── useOpThemeClasses ──────────────────────────────────────────

describe('useOpThemeClasses', () => {
  beforeEach(() => {
    clearContext()
  })

  test('gibt leere Klassen ohne Theme-Kontext zurück', () => {
    const classes = useOpThemeClasses('section')

    expect(classes).toEqual({})
  })

  test('gibt leere Klassen wenn Komponente nicht im Theme definiert', () => {
    const theme: OpThemeConfig = {
      name: 'test',
      components: {},
    }
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpThemeClasses('section')

    expect(classes).toEqual({})
  })

  test('löst Section-Klassen korrekt auf', () => {
    const theme: OpThemeConfig = {
      name: 'test',
      components: {
        section: {
          slots: { root: 'relative', inner: 'mx-auto' },
          variants: {
            type: {
              hero: { root: 'min-h-screen', inner: 'px-6' },
            },
          },
        },
      },
    }
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpThemeClasses('section', { type: 'hero' })

    expect(classes.root).toBe('relative min-h-screen')
    expect(classes.inner).toBe('mx-auto px-6')
  })

  test('löst Slot-Klassen korrekt auf', () => {
    const theme: OpThemeConfig = {
      name: 'test',
      components: {
        slot: {
          slots: { root: 'flex flex-col', empty: 'border-dashed' },
          variants: {
            name: {
              sidebar: { root: 'gap-4' },
            },
          },
        },
      },
    }
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpThemeClasses('slot', { name: 'sidebar' })

    expect(classes.root).toBe('flex flex-col gap-4')
    expect(classes.empty).toBe('border-dashed')
  })

  test('akzeptiert configOverrides und uiOverrides', () => {
    const theme: OpThemeConfig = {
      name: 'test',
      components: {
        section: {
          slots: { root: 'relative', inner: 'mx-auto max-w-7xl' },
        },
      },
    }
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpThemeClasses(
      'section',
      {},
      { inner: 'max-w-6xl' },
      { root: 'bg-black' },
    )

    expect(classes.root).toBe('relative bg-black')
    expect(classes.inner).toBe('mx-auto max-w-6xl')
  })
})

// ─── useOpBlockClasses ──────────────────────────────────────────

describe('useOpBlockClasses', () => {
  beforeEach(() => {
    clearContext()
  })

  test('gibt leere Klassen ohne Theme-Kontext zurück', () => {
    const classes = useOpBlockClasses('rich-text')

    expect(classes).toEqual({})
  })

  test('löst Block-spezifische Klassen auf', () => {
    const theme: OpThemeConfig = {
      name: 'test',
      components: {
        'block:rich-text': {
          slots: { root: 'prose prose-lg' },
        },
      },
    }
    provide(OP_THEME_KEY, Object.freeze(theme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses('rich-text')

    expect(classes.root).toBe('prose prose-lg')
  })
})

// ─── Default Theme Definitions ──────────────────────────────────

describe('Default Theme Definitions', () => {
  test('sectionTheme hat root und inner Slots', () => {
    expect(sectionTheme.slots.root).toBeDefined()
    expect(sectionTheme.slots.inner).toBeDefined()
  })

  test('sectionTheme hat type Variants (hero, features, cta, content, footer)', () => {
    const types = Object.keys(sectionTheme.variants!.type)
    expect(types).toContain('hero')
    expect(types).toContain('features')
    expect(types).toContain('cta')
    expect(types).toContain('content')
    expect(types).toContain('footer')
  })

  test('slotTheme hat root und empty Slots', () => {
    expect(slotTheme.slots.root).toBeDefined()
    expect(slotTheme.slots.empty).toBeDefined()
  })

  test('slotTheme hat name Variants (default, sidebar, media)', () => {
    const names = Object.keys(slotTheme.variants!.name)
    expect(names).toContain('default')
    expect(names).toContain('sidebar')
    expect(names).toContain('media')
  })

  test('sectionTheme hero Variant liefert korrekte Klassen über resolve', () => {
    const result = resolveComponentClasses(sectionTheme, { type: 'hero' })

    expect(result.root).toContain('relative')
    expect(result.root).toContain('min-h-[60vh]')
    expect(result.inner).toContain('px-6')
    expect(result.inner).toContain('py-24')
  })

  test('slotTheme default Variant liefert gap-6', () => {
    const result = resolveComponentClasses(slotTheme, { name: 'default' })

    expect(result.root).toContain('flex')
    expect(result.root).toContain('flex-col')
    expect(result.root).toContain('gap-6')
  })
})
