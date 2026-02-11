import { describe, test, expect, beforeEach } from 'bun:test'
import type { Page, SiteConfig, Navigation } from '@openpress/schemas'
import {
  clearContext,
  clearThemeRegistry,
  setupOpProvider,
  useOpProvider,
  useOpenPress,
  OpConfigSchema,
  SUPPORTED_THEMES,
  SUPPORTED_LOCALES,
  type OpConfig,
} from '../../index'

// ─── Test-Fixtures ───────────────────────────────────────────────

function createTestPage(): Page {
  return {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FA0',
    slug: 'test-page',
    title: { en: 'Test Page', de: 'Testseite' },
    meta: {},
    sections: [],
    updatedAt: '2025-02-10T12:00:00.000Z',
    createdAt: '2025-02-10T12:00:00.000Z',
  }
}

function createTestSite(overrides?: Partial<SiteConfig>): SiteConfig {
  return {
    name: 'Test Site',
    locale: 'de-DE',
    theme: 'tailwind-plus',
    meta: { title: 'Test Site', description: 'A test site' },
    ...overrides,
  }
}

// ─── Tests ───────────────────────────────────────────────────────

describe('OpProvider (dedicated)', () => {
  beforeEach(() => {
    clearContext()
    clearThemeRegistry()
  })

  // ── Locale ──────────────────────────────────────────────────

  describe('Locale', () => {
    test('verwendet site.locale als Default', () => {
      const state = setupOpProvider({
        page: createTestPage(),
        site: createTestSite({ locale: 'en-US' }),
      })

      expect(state.locale).toBe('en-US')
      expect(state.dataAttributes['data-op-locale']).toBe('en-US')
    })

    test('props.locale überschreibt site.locale', () => {
      const state = setupOpProvider({
        page: createTestPage(),
        site: createTestSite({ locale: 'de-DE' }),
        locale: 'en',
      })

      expect(state.locale).toBe('en')
      expect(state.dataAttributes['data-op-locale']).toBe('en')
    })

    test('Fallback auf de-DE wenn kein Locale gesetzt', () => {
      const state = setupOpProvider({
        page: createTestPage(),
        site: { name: 'No Locale', meta: {} } as SiteConfig,
      })

      expect(state.locale).toBe('de-DE')
    })
  })

  // ── useOpProvider ───────────────────────────────────────────

  describe('useOpProvider', () => {
    test('wirft Error außerhalb von OpProvider', () => {
      expect(() => useOpProvider()).toThrow(
        '[OpenPress] useOpProvider() muss innerhalb von <OpProvider> aufgerufen werden.'
      )
    })

    test('gibt Theme, Locale und Mode zurück', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        editing: true,
        locale: 'en',
      })

      const provider = useOpProvider()

      expect(provider.themeName).toBe('tailwind-plus')
      expect(provider.locale).toBe('en')
      expect(provider.mode).toBe('edit')
      expect(provider.isEditing).toBe(true)
    })

    test('resolve() gibt deutsche Übersetzung für de Locale', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        locale: 'de-DE',
      })

      const { resolve } = useOpProvider()

      expect(resolve({ en: 'Hello', de: 'Hallo' })).toBe('Hallo')
    })

    test('resolve() gibt englische Übersetzung für en Locale', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        locale: 'en-US',
      })

      const { resolve } = useOpProvider()

      expect(resolve({ en: 'Hello', de: 'Hallo' })).toBe('Hello')
    })

    test('resolve() fällt auf en zurück wenn Locale fehlt', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        locale: 'fr',
      })

      const { resolve } = useOpProvider()

      expect(resolve({ en: 'Hello', de: 'Hallo' })).toBe('Hello')
    })

    test('resolve() gibt leeren String für fehlende Übersetzung', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        locale: 'fr',
      })

      const { resolve } = useOpProvider()

      // Objekt ohne en und fr
      expect(resolve({ en: '' } as Record<string, string>)).toBe('')
    })
  })

  // ── OpConfigSchema ──────────────────────────────────────────

  describe('OpConfigSchema', () => {
    test('validiert vollständige Config', () => {
      const result = OpConfigSchema.safeParse({
        theme: 'material-expressive',
        locale: 'en-US',
        editing: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.theme).toBe('material-expressive')
        expect(result.data.locale).toBe('en-US')
        expect(result.data.editing).toBe(true)
      }
    })

    test('setzt Defaults für leeres Objekt', () => {
      const result = OpConfigSchema.safeParse({})

      expect(result.success).toBe(true)
      if (result.success) {
        const config: OpConfig = result.data
        expect(config.theme).toBe('tailwind-plus')
        expect(config.locale).toBe('de-DE')
        expect(config.editing).toBe(false)
      }
    })

    test('akzeptiert Custom-Theme-Namen', () => {
      const result = OpConfigSchema.safeParse({
        theme: 'my-custom-theme',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.theme).toBe('my-custom-theme')
      }
    })

    test('weist ungültige Typen ab', () => {
      const result = OpConfigSchema.safeParse({
        theme: 123,
        editing: 'not-a-boolean',
      })

      expect(result.success).toBe(false)
    })
  })

  // ── Constants ───────────────────────────────────────────────

  describe('Constants', () => {
    test('SUPPORTED_THEMES enthält bekannte Themes', () => {
      expect(SUPPORTED_THEMES).toContain('tailwind-plus')
      expect(SUPPORTED_THEMES).toContain('material-expressive')
    })

    test('SUPPORTED_LOCALES enthält en und de Varianten', () => {
      expect(SUPPORTED_LOCALES).toContain('en')
      expect(SUPPORTED_LOCALES).toContain('de')
      expect(SUPPORTED_LOCALES).toContain('en-US')
      expect(SUPPORTED_LOCALES).toContain('de-DE')
    })
  })

  // ── Integration: useOpProvider + useOpenPress ───────────────

  describe('Integration', () => {
    test('useOpProvider und useOpenPress teilen denselben Kontext', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        editing: true,
        theme: 'material-expressive',
      })

      const provider = useOpProvider()
      const openPress = useOpenPress()

      expect(provider.mode).toBe(openPress.mode)
      expect(provider.themeName).toBe(openPress.theme.name)
      expect(provider.isEditing).toBe(openPress.isEditing)
    })
  })
})
