import { describe, test, expect, beforeEach } from 'bun:test'
import type { Page, SiteConfig, Navigation, Section, Block } from '@openpress/schemas'
import {
  // Context
  clearContext,
  // Theme
  registerTheme,
  resolveTheme,
  loadTheme,
  clearThemeRegistry,
  // Blocks
  registerBlock,
  resolveBlockComponent,
  hasBlock,
  getRegisteredBlockTypes,
  clearBlockRegistry,
  OpBlockFallback,
  type BlockComponentDef,
  // Composables
  useOpenPress,
  useOpMode,
  useOpSection,
  useOpSlot,
  // Components
  setupOpProvider,
  setupOpSection,
  setupOpSlot,
  // Types
  type OpThemeConfig,
} from './index'

// ─── Test-Fixtures ───────────────────────────────────────────────

function createTestPage(): Page {
  return {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FA0',
    slug: 'test-page',
    title: 'Test Page',
    meta: {},
    sections: [
      {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FA1',
        type: 'hero',
        slots: {
          default: [
            { id: '01ARZ3NDEKTSV4RRFFQ69G5FA2', type: 'rich-text', props: { content: 'Hello' } },
            { id: '01ARZ3NDEKTSV4RRFFQ69G5FA3', type: 'button', props: { label: 'Click' } },
          ],
          media: [
            { id: '01ARZ3NDEKTSV4RRFFQ69G5FA4', type: 'image', props: { src: '/hero.jpg' } },
          ],
        },
      },
      {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FA5',
        type: 'features',
        slots: {
          default: [],
        },
      },
    ],
    updatedAt: '2025-02-10T12:00:00.000Z',
    createdAt: '2025-02-10T12:00:00.000Z',
  }
}

function createTestSite(): SiteConfig {
  return {
    name: 'Test Site',
    locale: 'de-DE',
    theme: 'tailwind-plus',
    meta: {
      title: 'Test Site',
      description: 'A test site',
    },
  }
}

function createTestNavigation(): Navigation {
  return {
    main: [
      { label: 'Home', href: '/', target: '_self', children: [] },
      { label: 'About', href: '/about', target: '_self', children: [] },
    ],
    footer: [
      { label: 'Impressum', href: '/impressum', target: '_self', children: [] },
    ],
  }
}

// ─── Tests ───────────────────────────────────────────────────────

describe('@openpress/ui', () => {
  beforeEach(() => {
    clearContext()
    clearThemeRegistry()
    clearBlockRegistry()
  })

  // ── OpProvider ──────────────────────────────────────────────

  describe('OpProvider', () => {
    test('stellt Page via provide bereit', () => {
      const page = createTestPage()
      const site = createTestSite()

      setupOpProvider({ page, site })
      const result = useOpenPress()

      expect(result.page).toEqual(page)
    })

    test('stellt SiteConfig via provide bereit', () => {
      const page = createTestPage()
      const site = createTestSite()

      setupOpProvider({ page, site })
      const result = useOpenPress()

      expect(result.site.name).toBe('Test Site')
      expect(result.site.locale).toBe('de-DE')
    })

    test('stellt Navigation via provide bereit', () => {
      const page = createTestPage()
      const site = createTestSite()
      const navigation = createTestNavigation()

      setupOpProvider({ page, site, navigation })
      const result = useOpenPress()

      expect(result.navigation.main).toHaveLength(2)
      expect(result.navigation.footer).toHaveLength(1)
    })

    test('setzt Default Navigation wenn nicht angegeben', () => {
      const page = createTestPage()
      const site = createTestSite()

      const state = setupOpProvider({ page, site })

      expect(state.navigation).toEqual({ main: [], footer: [] })
    })

    test('setzt Mode auf "view" per Default', () => {
      const page = createTestPage()
      const site = createTestSite()

      const state = setupOpProvider({ page, site })

      expect(state.mode).toBe('view')
      expect(state.dataAttributes['data-op-mode']).toBe('view')
    })

    test('Mode-Reaktivität: editing=true → mode="edit"', () => {
      const page = createTestPage()
      const site = createTestSite()

      const state = setupOpProvider({ page, site, editing: true })

      expect(state.mode).toBe('edit')
      expect(state.dataAttributes['data-op-mode']).toBe('edit')
    })

    test('Theme-Fallback: verwendet site.theme', () => {
      const page = createTestPage()
      const site = createTestSite()

      const state = setupOpProvider({ page, site })

      expect(state.theme.name).toBe('tailwind-plus')
      expect(state.dataAttributes['data-op-theme']).toBe('tailwind-plus')
    })

    test('Theme-Override: props.theme überschreibt site.theme', () => {
      const page = createTestPage()
      const site = createTestSite()

      const state = setupOpProvider({ page, site, theme: 'material-expressive' })

      expect(state.theme.name).toBe('material-expressive')
      expect(state.dataAttributes['data-op-theme']).toBe('material-expressive')
    })

    test('Data-Attribute sind korrekt gesetzt', () => {
      const page = createTestPage()
      const site = createTestSite()

      const state = setupOpProvider({ page, site, editing: true })

      expect(state.dataAttributes).toEqual({
        'data-op-mode': 'edit',
        'data-op-theme': 'tailwind-plus',
      })
    })
  })

  // ── useOpenPress ────────────────────────────────────────────

  describe('useOpenPress', () => {
    test('wirft Error außerhalb von OpProvider', () => {
      expect(() => useOpenPress()).toThrow(
        '[OpenPress] useOpenPress() muss innerhalb von <OpProvider> aufgerufen werden.'
      )
    })

    test('gibt isEditing=true im Edit-Modus', () => {
      const page = createTestPage()
      const site = createTestSite()

      setupOpProvider({ page, site, editing: true })
      const result = useOpenPress()

      expect(result.isEditing).toBe(true)
      expect(result.mode).toBe('edit')
    })

    test('gibt isEditing=false im View-Modus', () => {
      const page = createTestPage()
      const site = createTestSite()

      setupOpProvider({ page, site })
      const result = useOpenPress()

      expect(result.isEditing).toBe(false)
      expect(result.mode).toBe('view')
    })
  })

  // ── useOpMode ───────────────────────────────────────────────

  describe('useOpMode', () => {
    test('wirft Error außerhalb von OpProvider', () => {
      expect(() => useOpMode()).toThrow(
        '[OpenPress] useOpMode() muss innerhalb von <OpProvider> aufgerufen werden.'
      )
    })

    test('gibt korrekten Mode zurück', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        editing: true,
      })

      const { mode, isEditing } = useOpMode()

      expect(mode).toBe('edit')
      expect(isEditing).toBe(true)
    })
  })

  // ── OpSection ───────────────────────────────────────────────

  describe('OpSection', () => {
    test('rendert Section mit korrekten Slots', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
      })

      const section = createTestPage().sections[0]
      const state = setupOpSection({ section })

      expect(Object.keys(state.slots)).toEqual(['default', 'media'])
      expect(state.slots.default).toHaveLength(2)
      expect(state.slots.media).toHaveLength(1)
    })

    test('stellt Section-Kontext via provide bereit', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
      })

      const section = createTestPage().sections[0]
      setupOpSection({ section })

      const result = useOpSection()
      expect(result.section.id).toBe(section.id)
      expect(result.section.type).toBe('hero')
    })

    test('setzt data-Attribute korrekt', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
      })

      const section = createTestPage().sections[0]
      const state = setupOpSection({ section })

      expect(state.dataAttributes['data-op-section']).toBe('hero')
      expect(state.dataAttributes['data-op-id']).toBe(section.id)
      expect(state.dataAttributes['data-op-editing']).toBeUndefined()
    })

    test('setzt data-op-editing im Edit-Modus', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        editing: true,
      })

      const section = createTestPage().sections[0]
      const state = setupOpSection({ section })

      expect(state.dataAttributes['data-op-editing']).toBe('')
      expect(state.isEditing).toBe(true)
    })
  })

  // ── useOpSection ────────────────────────────────────────────

  describe('useOpSection', () => {
    test('wirft Error außerhalb von OpSection', () => {
      expect(() => useOpSection()).toThrow(
        '[OpenPress] useOpSection() muss innerhalb von <OpSection> aufgerufen werden.'
      )
    })
  })

  // ── OpSlot ──────────────────────────────────────────────────

  describe('OpSlot', () => {
    test('rendert Blocks in korrekter Reihenfolge', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
      })

      const section = createTestPage().sections[0]
      setupOpSection({ section })

      const blocks = section.slots.default
      const state = setupOpSlot({ name: 'default', blocks })

      expect(state.resolvedBlocks).toHaveLength(2)
      expect(state.resolvedBlocks[0].block.type).toBe('rich-text')
      expect(state.resolvedBlocks[1].block.type).toBe('button')
    })

    test('erkennt leeren Slot', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
      })

      const section = createTestPage().sections[1] // features - leerer default Slot
      setupOpSection({ section })

      const state = setupOpSlot({ name: 'default', blocks: [] })

      expect(state.isEmpty).toBe(true)
      expect(state.resolvedBlocks).toHaveLength(0)
    })

    test('leerer Slot im View-Modus: isEditing=false', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        editing: false,
      })

      const section = createTestPage().sections[1]
      setupOpSection({ section })

      const state = setupOpSlot({ name: 'default', blocks: [] })

      expect(state.isEmpty).toBe(true)
      expect(state.isEditing).toBe(false)
    })

    test('leerer Slot im Edit-Modus: zeigt Empty-State', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        editing: true,
      })

      const section = createTestPage().sections[1]
      setupOpSection({ section })

      const state = setupOpSlot({ name: 'default', blocks: [] })

      expect(state.isEmpty).toBe(true)
      expect(state.isEditing).toBe(true)
    })

    test('stellt Slot-Kontext via provide bereit', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
      })

      const section = createTestPage().sections[0]
      setupOpSection({ section })

      const blocks = section.slots.default
      const state = setupOpSlot({ name: 'default', blocks })

      expect(state.slotContext.name).toBe('default')
      expect(state.slotContext.sectionId).toBe(section.id)

      const result = useOpSlot()
      expect(result.slot.name).toBe('default')
      expect(result.slot.sectionId).toBe(section.id)
    })

    test('wirft Error ohne OpSection-Kontext', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
      })

      expect(() =>
        setupOpSlot({ name: 'default', blocks: [] })
      ).toThrow('[OpenPress] OpSlot muss innerhalb von <OpSection> verwendet werden.')
    })

    test('setzt data-Attribute korrekt', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        editing: true,
      })

      const section = createTestPage().sections[0]
      setupOpSection({ section })

      const blocks = section.slots.default
      const state = setupOpSlot({ name: 'default', blocks })

      expect(state.dataAttributes['data-op-slot']).toBe('default')
      expect(state.dataAttributes['data-op-editing']).toBe('')
    })
  })

  // ── useOpSlot ───────────────────────────────────────────────

  describe('useOpSlot', () => {
    test('wirft Error außerhalb von OpSlot', () => {
      expect(() => useOpSlot()).toThrow(
        '[OpenPress] useOpSlot() muss innerhalb von <OpSlot> aufgerufen werden.'
      )
    })
  })

  // ── Theme Resolution ────────────────────────────────────────

  describe('Theme Resolution', () => {
    test('resolveTheme gibt Fallback-Theme für unbekanntes Theme', () => {
      const theme = resolveTheme('unknown-theme')

      expect(theme.name).toBe('unknown-theme')
      expect(theme.components).toEqual({})
    })

    test('registerTheme + loadTheme lädt Theme async', async () => {
      const testTheme: OpThemeConfig = {
        name: 'test-theme',
        components: {
          section: {
            slots: { root: 'section-root', inner: 'section-inner' },
          },
        },
      }

      registerTheme('test-theme', async () => testTheme)
      const loaded = await loadTheme('test-theme')

      expect(loaded.name).toBe('test-theme')
      expect(loaded.components.section.slots.root).toBe('section-root')
    })

    test('loadTheme cached das Ergebnis', async () => {
      let callCount = 0
      registerTheme('cached-theme', async () => {
        callCount++
        return { name: 'cached-theme', components: {} }
      })

      await loadTheme('cached-theme')
      await loadTheme('cached-theme')

      expect(callCount).toBe(1)
    })

    test('loadTheme gibt Fallback wenn Theme nicht registriert', async () => {
      const theme = await loadTheme('non-existent')

      expect(theme.name).toBe('non-existent')
      expect(theme.components).toEqual({})
    })

    test('resolveTheme nutzt Cache nach loadTheme', async () => {
      const testTheme: OpThemeConfig = {
        name: 'sync-test',
        components: { button: { slots: { root: 'btn' } } },
      }

      registerTheme('sync-test', async () => testTheme)
      await loadTheme('sync-test')

      const resolved = resolveTheme('sync-test')
      expect(resolved.name).toBe('sync-test')
      expect(resolved.components.button.slots.root).toBe('btn')
    })
  })

  // ── Block Resolution ────────────────────────────────────────

  describe('Block Resolution', () => {
    test('resolveBlockComponent gibt Fallback für unbekannten Block-Type', () => {
      const component = resolveBlockComponent('unknown-block')

      expect(component).toBe(OpBlockFallback)
      expect(component.name).toBe('OpBlockFallback')
    })

    test('registerBlock + resolveBlockComponent', () => {
      const richTextBlock: BlockComponentDef = {
        name: 'RichTextBlock',
        render: (block) => ({ type: 'rich-text', content: block.props.content }),
      }

      registerBlock('rich-text', richTextBlock)
      const resolved = resolveBlockComponent('rich-text')

      expect(resolved).toBe(richTextBlock)
      expect(resolved.name).toBe('RichTextBlock')
    })

    test('hasBlock prüft Registration', () => {
      expect(hasBlock('rich-text')).toBe(false)

      registerBlock('rich-text', { name: 'RichText' })

      expect(hasBlock('rich-text')).toBe(true)
    })

    test('getRegisteredBlockTypes listet alle Types', () => {
      registerBlock('rich-text', { name: 'RichText' })
      registerBlock('image', { name: 'Image' })
      registerBlock('button', { name: 'Button' })

      const types = getRegisteredBlockTypes()

      expect(types).toContain('rich-text')
      expect(types).toContain('image')
      expect(types).toContain('button')
      expect(types).toHaveLength(3)
    })

    test('OpBlockFallback rendert Fallback-Output', () => {
      const block = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FA9',
        type: 'unknown-type',
        props: {},
      }

      const output = OpBlockFallback.render!(block)

      expect(output).toEqual({
        type: 'fallback',
        blockType: 'unknown-type',
        blockId: '01ARZ3NDEKTSV4RRFFQ69G5FA9',
      })
    })

    test('Slot löst registrierte Blocks korrekt auf', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
      })

      const richTextBlock: BlockComponentDef = { name: 'RichText' }
      const buttonBlock: BlockComponentDef = { name: 'Button' }
      registerBlock('rich-text', richTextBlock)
      registerBlock('button', buttonBlock)

      const section = createTestPage().sections[0]
      setupOpSection({ section })

      const blocks = section.slots.default
      const state = setupOpSlot({ name: 'default', blocks })

      expect(state.resolvedBlocks[0].component).toBe(richTextBlock)
      expect(state.resolvedBlocks[1].component).toBe(buttonBlock)
    })

    test('Slot nutzt Fallback für unregistrierte Blocks', () => {
      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
      })

      const section = createTestPage().sections[0]
      setupOpSection({ section })

      const blocks = section.slots.default
      const state = setupOpSlot({ name: 'default', blocks })

      // Keine Blocks registriert → alle nutzen Fallback
      expect(state.resolvedBlocks[0].component).toBe(OpBlockFallback)
      expect(state.resolvedBlocks[1].component).toBe(OpBlockFallback)
    })
  })

  // ── Provide/Inject Hierarchie ───────────────────────────────

  describe('Provide/Inject Hierarchie', () => {
    test('vollständige Hierarchie: Provider → Section → Slot', () => {
      const page = createTestPage()
      const site = createTestSite()
      const navigation = createTestNavigation()

      // 1. Provider
      const providerState = setupOpProvider({ page, site, navigation, editing: true })
      expect(providerState.mode).toBe('edit')

      // 2. Composable auf Provider-Ebene
      const openPress = useOpenPress()
      expect(openPress.page.title).toBe('Test Page')
      expect(openPress.isEditing).toBe(true)

      // 3. Section
      const section = page.sections[0]
      const sectionState = setupOpSection({ section })
      expect(sectionState.section.type).toBe('hero')

      // 4. Composable auf Section-Ebene
      const { section: injectedSection } = useOpSection()
      expect(injectedSection.type).toBe('hero')

      // 5. Slot
      const blocks = section.slots.default
      const slotState = setupOpSlot({ name: 'default', blocks })
      expect(slotState.slotContext.sectionId).toBe(section.id)

      // 6. Composable auf Slot-Ebene
      const { slot } = useOpSlot()
      expect(slot.name).toBe('default')
      expect(slot.sectionId).toBe(section.id)
    })
  })

  // ── Zod-Validierung ─────────────────────────────────────────

  describe('Zod Schema Validierung', () => {
    test('PageSchema validiert Test-Fixtures korrekt', async () => {
      const { PageSchema } = await import('@openpress/schemas')
      const page = createTestPage()

      const result = PageSchema.safeParse(page)
      expect(result.success).toBe(true)
    })

    test('SectionSchema validiert Section korrekt', async () => {
      const { SectionSchema } = await import('@openpress/schemas')
      const section = createTestPage().sections[0]

      const result = SectionSchema.safeParse(section)
      expect(result.success).toBe(true)
    })

    test('BlockSchema validiert Blocks korrekt', async () => {
      const { BlockSchema } = await import('@openpress/schemas')
      const block = createTestPage().sections[0].slots.default[0]

      const result = BlockSchema.safeParse(block)
      expect(result.success).toBe(true)
    })

    test('PageSchema weist ungültige Daten ab', async () => {
      const { PageSchema } = await import('@openpress/schemas')

      const result = PageSchema.safeParse({
        id: 'not-a-ulid',
        slug: 'INVALID SLUG',
      })

      expect(result.success).toBe(false)
    })
  })
})
