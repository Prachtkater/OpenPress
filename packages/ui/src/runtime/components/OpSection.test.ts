import { describe, test, expect, beforeEach } from 'bun:test'
import type { Page, SiteConfig, Section, Block } from '@openpress/schemas'
import { SectionSchema, BlockSchema } from '@openpress/schemas'
import { z } from 'zod'
import {
  clearContext,
  clearThemeRegistry,
  clearBlockRegistry,
  setupOpProvider,
  setupOpSection,
  setupOpSlot,
  useOpSection,
  useOpSlot,
  useOpThemeClasses,
  registerBlock,
  resolveBlockComponent,
  OpBlockFallback,
  registerTheme,
  loadTheme,
  type BlockComponentDef,
  type OpThemeConfig,
} from '../../index'

// ─── Test-Fixtures ───────────────────────────────────────────────

function createTestSection(overrides?: Partial<Section>): Section {
  return {
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
    ...overrides,
  }
}

function createTestPage(): Page {
  return {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FA0',
    slug: 'test-page',
    title: { en: 'Test Page' },
    meta: {},
    sections: [createTestSection()],
    updatedAt: '2025-02-10T12:00:00.000Z',
    createdAt: '2025-02-10T12:00:00.000Z',
  }
}

function createTestSite(): SiteConfig {
  return {
    name: 'Test Site',
    locale: 'de-DE',
    theme: 'tailwind-plus',
    meta: { title: 'Test Site', description: 'A test site' },
  }
}

function setupProvider(editing = false) {
  setupOpProvider({
    page: createTestPage(),
    site: createTestSite(),
    editing,
  })
}

// ─── Tests ───────────────────────────────────────────────────────

describe('OpSection & OpSlot Komponenten', () => {
  beforeEach(() => {
    clearContext()
    clearThemeRegistry()
    clearBlockRegistry()
  })

  // ── OpSection ──────────────────────────────────────────────

  describe('OpSection', () => {
    test('Section rendert alle Slots', () => {
      setupProvider()
      const section = createTestSection()
      const state = setupOpSection({ section })

      expect(Object.keys(state.slots)).toEqual(['default', 'media'])
      expect(state.slots.default).toHaveLength(2)
      expect(state.slots.media).toHaveLength(1)
    })

    test('Section stellt Kontext via provide bereit', () => {
      setupProvider()
      const section = createTestSection()
      setupOpSection({ section })

      const result = useOpSection()
      expect(result.section.id).toBe(section.id)
      expect(result.section.type).toBe('hero')
    })

    test('Section data-Attribute korrekt gesetzt', () => {
      setupProvider()
      const section = createTestSection()
      const state = setupOpSection({ section })

      expect(state.dataAttributes['data-op-section']).toBe('hero')
      expect(state.dataAttributes['data-op-id']).toBe(section.id)
      expect(state.dataAttributes['data-op-editing']).toBeUndefined()
    })

    test('Section data-op-editing im Edit-Modus', () => {
      setupProvider(true)
      const section = createTestSection()
      const state = setupOpSection({ section })

      expect(state.dataAttributes['data-op-editing']).toBe('')
      expect(state.isEditing).toBe(true)
    })

    test('Section mit verschiedenen Types', () => {
      setupProvider()

      for (const type of ['hero', 'features', 'cta', 'content', 'footer']) {
        clearContext()
        setupProvider()
        const section = createTestSection({ type })
        const state = setupOpSection({ section })

        expect(state.dataAttributes['data-op-section']).toBe(type)
      }
    })
  })

  // ── OpSlot ─────────────────────────────────────────────────

  describe('OpSlot', () => {
    test('Slot rendert Blocks in korrekter Reihenfolge', () => {
      setupProvider()
      const section = createTestSection()
      setupOpSection({ section })

      const blocks = section.slots.default
      const state = setupOpSlot({ name: 'default', blocks })

      expect(state.resolvedBlocks).toHaveLength(2)
      expect(state.resolvedBlocks[0].block.type).toBe('rich-text')
      expect(state.resolvedBlocks[1].block.type).toBe('button')
    })

    test('Slot Empty State im Edit-Modus', () => {
      setupProvider(true)
      const section = createTestSection()
      setupOpSection({ section })

      const state = setupOpSlot({ name: 'default', blocks: [] })

      expect(state.isEmpty).toBe(true)
      expect(state.isEditing).toBe(true)
    })

    test('Slot Hidden wenn leer im View-Modus', () => {
      setupProvider(false)
      const section = createTestSection()
      setupOpSection({ section })

      const state = setupOpSlot({ name: 'default', blocks: [] })

      expect(state.isEmpty).toBe(true)
      expect(state.isEditing).toBe(false)
    })

    test('Slot stellt Kontext via provide bereit', () => {
      setupProvider()
      const section = createTestSection()
      setupOpSection({ section })

      const blocks = section.slots.default
      setupOpSlot({ name: 'default', blocks })

      const result = useOpSlot()
      expect(result.slot.name).toBe('default')
      expect(result.slot.sectionId).toBe(section.id)
    })

    test('Slot data-Attribute korrekt gesetzt', () => {
      setupProvider(true)
      const section = createTestSection()
      setupOpSection({ section })

      const blocks = section.slots.default
      const state = setupOpSlot({ name: 'default', blocks })

      expect(state.dataAttributes['data-op-slot']).toBe('default')
      expect(state.dataAttributes['data-op-editing']).toBe('')
    })

    test('Slot wirft Error ohne OpSection-Kontext', () => {
      setupProvider()

      expect(() =>
        setupOpSlot({ name: 'default', blocks: [] }),
      ).toThrow('[OpenPress] OpSlot muss innerhalb von <OpSection> verwendet werden.')
    })
  })

  // ── Block Fallback ─────────────────────────────────────────

  describe('Block Fallback', () => {
    test('Unbekannter Block-Type gibt Fallback zurück', () => {
      const component = resolveBlockComponent('unknown-type')
      expect(component).toBe(OpBlockFallback)
      expect(component.name).toBe('OpBlockFallback')
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

    test('Registrierter Block wird korrekt aufgelöst', () => {
      const richText: BlockComponentDef = { name: 'RichText' }
      registerBlock('rich-text', richText)

      const resolved = resolveBlockComponent('rich-text')
      expect(resolved).toBe(richText)
    })
  })

  // ── Block Registry in Slot ─────────────────────────────────

  describe('Block Registry Integration', () => {
    test('Slot löst registrierte Blocks korrekt auf', () => {
      setupProvider()
      const section = createTestSection()
      setupOpSection({ section })

      const richText: BlockComponentDef = { name: 'RichText' }
      const button: BlockComponentDef = { name: 'Button' }
      registerBlock('rich-text', richText)
      registerBlock('button', button)

      const blocks = section.slots.default
      const state = setupOpSlot({ name: 'default', blocks })

      expect(state.resolvedBlocks[0].component).toBe(richText)
      expect(state.resolvedBlocks[1].component).toBe(button)
    })

    test('Slot nutzt Fallback für unregistrierte Blocks', () => {
      setupProvider()
      const section = createTestSection()
      setupOpSection({ section })

      const blocks = section.slots.default
      const state = setupOpSlot({ name: 'default', blocks })

      expect(state.resolvedBlocks[0].component).toBe(OpBlockFallback)
      expect(state.resolvedBlocks[1].component).toBe(OpBlockFallback)
    })
  })

  // ── Scoped Slot Override ───────────────────────────────────

  describe('Scoped Slot Override', () => {
    test('Section gibt Slots-Daten für manuelles Layout bereit', () => {
      setupProvider()
      const section = createTestSection()
      const state = setupOpSection({ section })

      // Das Scoped-Slot-Pattern stellt section und slots zur Verfügung
      expect(state.section).toBeDefined()
      expect(state.slots).toBeDefined()
      expect(state.slots.default).toHaveLength(2)
      expect(state.slots.media).toHaveLength(1)

      // Theme kann die Slots manuell platzieren
      const defaultSlotBlocks = state.slots.default
      const mediaSlotBlocks = state.slots.media

      expect(defaultSlotBlocks[0].type).toBe('rich-text')
      expect(mediaSlotBlocks[0].type).toBe('image')
    })
  })

  // ── Provide/Inject Hierarchie ──────────────────────────────

  describe('Inject Hierarchie', () => {
    test('Provider → Section → Slot: Korrekte Kontexte', () => {
      setupProvider(true)

      // Section
      const section = createTestSection()
      const sectionState = setupOpSection({ section })
      expect(sectionState.section.type).toBe('hero')
      expect(sectionState.isEditing).toBe(true)

      // Section-Kontext
      const { section: injectedSection } = useOpSection()
      expect(injectedSection.type).toBe('hero')

      // Slot
      const blocks = section.slots.default
      const slotState = setupOpSlot({ name: 'default', blocks })
      expect(slotState.slotContext.sectionId).toBe(section.id)
      expect(slotState.slotContext.name).toBe('default')
      expect(slotState.isEditing).toBe(true)

      // Slot-Kontext
      const { slot } = useOpSlot()
      expect(slot.name).toBe('default')
      expect(slot.sectionId).toBe(section.id)
    })
  })

  // ── Zod-Validierung ────────────────────────────────────────

  describe('Zod Schema Validierung', () => {
    test('SectionSchema validiert gültige Section', () => {
      const section = createTestSection()
      const result = SectionSchema.safeParse(section)
      expect(result.success).toBe(true)
    })

    test('SectionSchema weist ungültige Section ab', () => {
      const result = SectionSchema.safeParse({
        id: 'not-a-ulid',
        type: '',
        slots: {},
      })
      expect(result.success).toBe(false)
    })

    test('BlockSchema validiert gültigen Block', () => {
      const block = { id: '01ARZ3NDEKTSV4RRFFQ69G5FA2', type: 'rich-text', props: { content: 'Hello' } }
      const result = BlockSchema.safeParse(block)
      expect(result.success).toBe(true)
    })

    test('BlockSchema weist ungültigen Block ab', () => {
      const result = BlockSchema.safeParse({
        id: 'invalid',
        type: '',
        props: {},
      })
      expect(result.success).toBe(false)
    })

    test('Blocks-Array Validierung mit Zod', () => {
      const blocks = [
        { id: '01ARZ3NDEKTSV4RRFFQ69G5FA2', type: 'rich-text', props: { content: 'Hello' } },
        { id: '01ARZ3NDEKTSV4RRFFQ69G5FA3', type: 'button', props: { label: 'Click' } },
      ]

      const result = z.array(BlockSchema).safeParse(blocks)
      expect(result.success).toBe(true)
    })
  })

  // ── Theme-Klassen Auflösung ────────────────────────────────

  describe('Theme-Klassen für Section & Slot', () => {
    test('useOpThemeClasses gibt leeres Objekt ohne Theme', () => {
      // Kein Provider → kein Theme im Kontext
      const classes = useOpThemeClasses('section', { type: 'hero' })
      expect(classes).toEqual({})
    })

    test('useOpThemeClasses löst Section-Klassen mit Theme auf', async () => {
      const testTheme: OpThemeConfig = {
        name: 'test',
        components: {
          section: {
            slots: { root: 'section-root', inner: 'section-inner' },
            variants: {
              type: {
                hero: {
                  root: 'hero-root',
                  inner: 'hero-inner',
                },
              },
            },
          },
        },
      }

      registerTheme('test', async () => testTheme)
      await loadTheme('test')

      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        theme: 'test',
      })

      const classes = useOpThemeClasses('section', { type: 'hero' })
      expect(classes.root).toContain('hero-root')
      expect(classes.inner).toContain('hero-inner')
    })

    test('useOpThemeClasses löst Slot-Klassen mit Theme auf', async () => {
      const testTheme: OpThemeConfig = {
        name: 'test',
        components: {
          slot: {
            slots: { root: 'slot-root', empty: 'slot-empty' },
            variants: {
              name: {
                default: { root: 'default-gap' },
                sidebar: { root: 'sidebar-gap' },
              },
            },
          },
        },
      }

      registerTheme('test', async () => testTheme)
      await loadTheme('test')

      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        theme: 'test',
      })

      const classes = useOpThemeClasses('slot', { name: 'default' })
      expect(classes.root).toContain('default-gap')
    })

    test('ui Prop Overrides werden angewendet', async () => {
      const testTheme: OpThemeConfig = {
        name: 'test',
        components: {
          section: {
            slots: { root: 'base-root', inner: 'base-inner' },
          },
        },
      }

      registerTheme('test', async () => testTheme)
      await loadTheme('test')

      setupOpProvider({
        page: createTestPage(),
        site: createTestSite(),
        theme: 'test',
      })

      const uiOverrides = { root: 'custom-root', inner: 'custom-inner' }
      const classes = useOpThemeClasses('section', {}, undefined, uiOverrides)

      expect(classes.root).toContain('custom-root')
      expect(classes.inner).toContain('custom-inner')
    })
  })
})
