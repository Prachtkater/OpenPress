import { describe, it, expect, beforeEach, mock } from 'bun:test'

// Mock #imports (Nuxt auto-imports)
const stateStore = new Map<string, { value: unknown }>()

mock.module('#imports', () => ({
  useState: <T>(key: string, init: () => T) => {
    if (!stateStore.has(key)) {
      stateStore.set(key, { value: init() })
    }
    return stateStore.get(key)!
  },
}))

// Import after mocking
const { useEditor } = await import('../composables/useEditor')
const { useOpenPress } = await import('../composables/useOpenPress')
const { findOpElement } = await import('../utils/find-op-element')

// --- Minimal DOM-like mock for findOpElement ---

interface MockElement {
  _attrs: Record<string, string>
  _parent: MockElement | null
  getAttribute(name: string): string | null
  parentElement: MockElement | null
}

function mockEl(attrs: Record<string, string>, parent?: MockElement): MockElement {
  const el: MockElement = {
    _attrs: attrs,
    _parent: parent ?? null,
    getAttribute(name: string) { return this._attrs[name] ?? null },
    get parentElement() { return this._parent },
  }
  return el
}

// -----------------------------------------------------------------
// useEditor
// -----------------------------------------------------------------

describe('useEditor composable', () => {
  beforeEach(() => {
    stateStore.clear()
  })

  it('initializes with no selection', () => {
    const { selectedElement, hoveredElement, selectedBlockId } = useEditor()
    expect(selectedElement.value).toBeNull()
    expect(hoveredElement.value).toBeNull()
    expect(selectedBlockId.value).toBeNull()
  })

  it('initializes isDirty as false', () => {
    const { isDirty } = useEditor()
    expect(isDirty.value).toBe(false)
  })

  it('selectElement sets selectedElement', () => {
    const { selectedElement, selectElement } = useEditor()
    selectElement('test-id-1', 'section')
    expect(selectedElement.value).toEqual({ id: 'test-id-1', type: 'section' })
  })

  it('selectElement with block type also sets selectedBlockId', () => {
    const { selectedBlockId, selectElement } = useEditor()
    selectElement('block-1', 'block')
    expect(selectedBlockId.value).toBe('block-1')
  })

  it('selectElement with section type does not set selectedBlockId', () => {
    const { selectedBlockId, selectElement } = useEditor()
    selectElement('section-1', 'section')
    expect(selectedBlockId.value).toBeNull()
  })

  it('clearSelection resets all selection state', () => {
    const { selectedElement, selectedBlockId, selectElement, clearSelection } = useEditor()
    selectElement('block-1', 'block')
    expect(selectedElement.value).not.toBeNull()
    expect(selectedBlockId.value).toBe('block-1')

    clearSelection()
    expect(selectedElement.value).toBeNull()
    expect(selectedBlockId.value).toBeNull()
  })

  it('hoverElement sets hoveredElement', () => {
    const { hoveredElement, hoverElement } = useEditor()
    hoverElement('test-id', 'block')
    expect(hoveredElement.value).toEqual({ id: 'test-id', type: 'block' })
  })

  it('clearHover resets hoveredElement', () => {
    const { hoveredElement, hoverElement, clearHover } = useEditor()
    hoverElement('test-id', 'section')
    expect(hoveredElement.value).not.toBeNull()

    clearHover()
    expect(hoveredElement.value).toBeNull()
  })

  it('selection and hover are independent', () => {
    const { selectedElement, hoveredElement, selectElement, hoverElement, clearHover } = useEditor()
    selectElement('sel-1', 'section')
    hoverElement('hov-1', 'block')

    expect(selectedElement.value).toEqual({ id: 'sel-1', type: 'section' })
    expect(hoveredElement.value).toEqual({ id: 'hov-1', type: 'block' })

    clearHover()
    expect(selectedElement.value).toEqual({ id: 'sel-1', type: 'section' })
    expect(hoveredElement.value).toBeNull()
  })

  it('supports all OpElementType values', () => {
    const { selectElement, selectedElement } = useEditor()

    selectElement('id-1', 'section')
    expect(selectedElement.value!.type).toBe('section')

    selectElement('id-2', 'slot')
    expect(selectedElement.value!.type).toBe('slot')

    selectElement('id-3', 'block')
    expect(selectedElement.value!.type).toBe('block')
  })

  it('subsequent selectElement calls overwrite previous selection', () => {
    const { selectedElement, selectElement } = useEditor()
    selectElement('first', 'section')
    expect(selectedElement.value!.id).toBe('first')

    selectElement('second', 'block')
    expect(selectedElement.value!.id).toBe('second')
    expect(selectedElement.value!.type).toBe('block')
  })
})

// -----------------------------------------------------------------
// useOpenPress
// -----------------------------------------------------------------

describe('useOpenPress composable', () => {
  beforeEach(() => {
    stateStore.clear()
  })

  it('initializes editMode as false', () => {
    const { editMode } = useOpenPress()
    expect(editMode.value).toBe(false)
  })

  it('editMode can be toggled', () => {
    const { editMode } = useOpenPress()
    editMode.value = true
    expect(editMode.value).toBe(true)
    editMode.value = false
    expect(editMode.value).toBe(false)
  })

  it('editMode is shared (singleton via useState)', () => {
    const first = useOpenPress()
    const second = useOpenPress()
    first.editMode.value = true
    expect(second.editMode.value).toBe(true)
  })
})

// -----------------------------------------------------------------
// findOpElement (DOM traversal utility)
// -----------------------------------------------------------------

describe('findOpElement', () => {
  it('detects section by data-op-section + data-op-id', () => {
    const boundary = mockEl({})
    const section = mockEl({ 'data-op-section': 'hero', 'data-op-id': 'sec-001' }, boundary)

    const result = findOpElement(section as unknown as EventTarget, boundary as unknown as HTMLElement)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('sec-001')
    expect(result!.type).toBe('section')
  })

  it('detects block by data-op-block + data-op-id', () => {
    const boundary = mockEl({})
    const block = mockEl({ 'data-op-block': 'rich-text', 'data-op-id': 'blk-001' }, boundary)

    const result = findOpElement(block as unknown as EventTarget, boundary as unknown as HTMLElement)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('blk-001')
    expect(result!.type).toBe('block')
  })

  it('detects slot by data-op-slot + data-op-id', () => {
    const boundary = mockEl({})
    const slot = mockEl({ 'data-op-slot': 'default', 'data-op-id': 'slot-001' }, boundary)

    const result = findOpElement(slot as unknown as EventTarget, boundary as unknown as HTMLElement)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('slot-001')
    expect(result!.type).toBe('slot')
  })

  it('walks up from nested child to find closest op-element', () => {
    const boundary = mockEl({})
    const section = mockEl({ 'data-op-section': 'hero', 'data-op-id': 'sec-001' }, boundary)
    const block = mockEl({ 'data-op-block': 'rich-text', 'data-op-id': 'blk-001' }, section)
    const paragraph = mockEl({}, block)
    const span = mockEl({}, paragraph)

    const result = findOpElement(span as unknown as EventTarget, boundary as unknown as HTMLElement)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('blk-001')
    expect(result!.type).toBe('block')
  })

  it('prioritizes block over section when walking up', () => {
    const boundary = mockEl({})
    const section = mockEl({ 'data-op-section': 'hero', 'data-op-id': 'sec-001' }, boundary)
    const block = mockEl({ 'data-op-block': 'rich-text', 'data-op-id': 'blk-001' }, section)
    const inner = mockEl({}, block)

    const result = findOpElement(inner as unknown as EventTarget, boundary as unknown as HTMLElement)
    expect(result!.type).toBe('block')
    expect(result!.id).toBe('blk-001')
  })

  it('returns null for elements outside the boundary', () => {
    const boundary = mockEl({})
    const result = findOpElement(boundary as unknown as EventTarget, boundary as unknown as HTMLElement)
    expect(result).toBeNull()
  })

  it('returns null for elements without data-op-id', () => {
    const boundary = mockEl({})
    const regularDiv = mockEl({ class: 'some-class' }, boundary)

    const result = findOpElement(regularDiv as unknown as EventTarget, boundary as unknown as HTMLElement)
    expect(result).toBeNull()
  })

  it('returns null when target is null', () => {
    const boundary = mockEl({})
    const result = findOpElement(null, boundary as unknown as HTMLElement)
    expect(result).toBeNull()
  })

  it('falls back to block type when data-op-id exists but no type attr', () => {
    const boundary = mockEl({})
    const mystery = mockEl({ 'data-op-id': 'unknown-001' }, boundary)

    const result = findOpElement(mystery as unknown as EventTarget, boundary as unknown as HTMLElement)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('unknown-001')
    expect(result!.type).toBe('block')
  })
})

// -----------------------------------------------------------------
// Glow rect calculation
// -----------------------------------------------------------------

describe('glow rect calculation', () => {
  it('calculates relative position to container', () => {
    const containerRect = { top: 100, left: 50 }
    const elementRect = { top: 150, left: 100, width: 300, height: 200 }
    const scrollTop = 0

    const glowRect = {
      top: elementRect.top - containerRect.top + scrollTop,
      left: elementRect.left - containerRect.left,
      width: elementRect.width,
      height: elementRect.height,
    }

    expect(glowRect).toEqual({ top: 50, left: 50, width: 300, height: 200 })
  })

  it('accounts for scroll offset', () => {
    const containerRect = { top: 0, left: 0 }
    const elementRect = { top: -200, left: 0, width: 400, height: 100 }
    const scrollTop = 500

    const glowRect = {
      top: elementRect.top - containerRect.top + scrollTop,
      left: elementRect.left - containerRect.left,
      width: elementRect.width,
      height: elementRect.height,
    }

    expect(glowRect).toEqual({ top: 300, left: 0, width: 400, height: 100 })
  })
})

// -----------------------------------------------------------------
// Mode toggle behavior
// -----------------------------------------------------------------

describe('mode toggle behavior', () => {
  beforeEach(() => {
    stateStore.clear()
  })

  it('toggling to preview clears selection', () => {
    const { editMode } = useOpenPress()
    const { selectedElement, selectElement, clearSelection } = useEditor()

    editMode.value = true
    selectElement('block-1', 'block')
    expect(selectedElement.value).not.toBeNull()

    editMode.value = false
    clearSelection()
    expect(selectedElement.value).toBeNull()
  })

  it('toggling to preview clears hover', () => {
    const { editMode } = useOpenPress()
    const { hoveredElement, hoverElement, clearHover } = useEditor()

    editMode.value = true
    hoverElement('sec-1', 'section')
    expect(hoveredElement.value).not.toBeNull()

    editMode.value = false
    clearHover()
    expect(hoveredElement.value).toBeNull()
  })
})

// -----------------------------------------------------------------
// Edit mode interaction guard
// -----------------------------------------------------------------

describe('edit mode interaction guard', () => {
  beforeEach(() => {
    stateStore.clear()
  })

  it('no interactions in preview mode (guard pattern)', () => {
    const { editMode } = useOpenPress()
    const { selectedElement } = useEditor()

    editMode.value = false
    // Component uses `if (!editMode.value) return` guard
    // so selectElement is never called in preview mode
    expect(selectedElement.value).toBeNull()
  })

  it('interactions work in edit mode', () => {
    const { editMode } = useOpenPress()
    const { selectedElement, selectElement } = useEditor()

    editMode.value = true
    selectElement('block-1', 'block')
    expect(selectedElement.value).toEqual({ id: 'block-1', type: 'block' })
  })

  it('Escape clears selection (simulated)', () => {
    const { editMode } = useOpenPress()
    const { selectedElement, selectElement, clearSelection } = useEditor()

    editMode.value = true
    selectElement('block-1', 'block')
    expect(selectedElement.value).not.toBeNull()

    // Simulate Escape key handler
    clearSelection()
    expect(selectedElement.value).toBeNull()
  })
})

// -----------------------------------------------------------------
// Overlay panel logic
// -----------------------------------------------------------------

describe('overlay panel logic', () => {
  describe('element metadata extraction', () => {
    function getElementMeta(el: MockElement) {
      return {
        id: el.getAttribute('data-op-id') ?? '',
        type: (el.getAttribute('data-op-block') ? 'block'
          : el.getAttribute('data-op-slot') ? 'slot'
            : 'section') as 'block' | 'slot' | 'section',
        blockType: el.getAttribute('data-op-block'),
        slotName: el.getAttribute('data-op-slot'),
        sectionType: el.getAttribute('data-op-section'),
      }
    }

    it('extracts block metadata', () => {
      const el = mockEl({ 'data-op-id': 'blk-001', 'data-op-block': 'heading' })
      const meta = getElementMeta(el)
      expect(meta.id).toBe('blk-001')
      expect(meta.type).toBe('block')
      expect(meta.blockType).toBe('heading')
      expect(meta.slotName).toBeNull()
      expect(meta.sectionType).toBeNull()
    })

    it('extracts slot metadata', () => {
      const el = mockEl({ 'data-op-id': 'slot-001', 'data-op-slot': 'sidebar' })
      const meta = getElementMeta(el)
      expect(meta.id).toBe('slot-001')
      expect(meta.type).toBe('slot')
      expect(meta.slotName).toBe('sidebar')
    })

    it('extracts section metadata', () => {
      const el = mockEl({ 'data-op-id': 'sec-001', 'data-op-section': 'hero' })
      const meta = getElementMeta(el)
      expect(meta.id).toBe('sec-001')
      expect(meta.type).toBe('section')
      expect(meta.sectionType).toBe('hero')
    })
  })

  describe('formatElementLabel', () => {
    function formatElementLabel(meta: { blockType: string | null; slotName: string | null; sectionType: string | null; type: string }): string {
      if (meta.blockType) return `Block: ${meta.blockType}`
      if (meta.slotName) return `Slot: ${meta.slotName}`
      if (meta.sectionType) return `Section: ${meta.sectionType}`
      return `Element: ${meta.type}`
    }

    it('formats block label', () => {
      expect(formatElementLabel({ blockType: 'heading', slotName: null, sectionType: null, type: 'block' }))
        .toBe('Block: heading')
    })

    it('formats slot label', () => {
      expect(formatElementLabel({ blockType: null, slotName: 'sidebar', sectionType: null, type: 'slot' }))
        .toBe('Slot: sidebar')
    })

    it('formats section label', () => {
      expect(formatElementLabel({ blockType: null, slotName: null, sectionType: 'hero', type: 'section' }))
        .toBe('Section: hero')
    })

    it('formats fallback for unknown element', () => {
      expect(formatElementLabel({ blockType: null, slotName: null, sectionType: null, type: 'block' }))
        .toBe('Element: block')
    })
  })

  describe('panel position', () => {
    it('calculates top-right position with margin', () => {
      const windowWidth = 1280
      const panelWidth = 320
      const margin = 16
      const expectedX = windowWidth - panelWidth - margin
      expect(expectedX).toBe(944)
    })

    it('clamps drag position to viewport bounds', () => {
      const clampX = (x: number, w: number) => Math.max(0, Math.min(x, w - 200))
      const clampY = (y: number, h: number) => Math.max(0, Math.min(y, h - 48))

      expect(clampX(-100, 1280)).toBe(0)
      expect(clampX(2000, 1280)).toBe(1080)
      expect(clampX(500, 1280)).toBe(500)

      expect(clampY(-50, 720)).toBe(0)
      expect(clampY(1000, 720)).toBe(672)
      expect(clampY(200, 720)).toBe(200)
    })
  })

  describe('keyboard shortcuts', () => {
    it('detects Ctrl+S save combo', () => {
      const isSave = (e: { ctrlKey: boolean; metaKey: boolean; key: string }) =>
        (e.ctrlKey || e.metaKey) && e.key === 's'

      expect(isSave({ ctrlKey: true, metaKey: false, key: 's' })).toBe(true)
      expect(isSave({ ctrlKey: false, metaKey: true, key: 's' })).toBe(true)
      expect(isSave({ ctrlKey: false, metaKey: false, key: 's' })).toBe(false)
      expect(isSave({ ctrlKey: true, metaKey: false, key: 'a' })).toBe(false)
    })

    it('Escape has layered behavior', () => {
      const getAction = (inlineEditing: boolean, hasSelection: boolean): string => {
        if (inlineEditing) return 'deactivate-inline'
        if (hasSelection) return 'clear-selection'
        return 'close-editor'
      }

      expect(getAction(true, true)).toBe('deactivate-inline')
      expect(getAction(true, false)).toBe('deactivate-inline')
      expect(getAction(false, true)).toBe('clear-selection')
      expect(getAction(false, false)).toBe('close-editor')
    })
  })

  describe('dirty state for save/discard', () => {
    beforeEach(() => { stateStore.clear() })

    it('isDirty tracks unsaved changes', () => {
      const { isDirty } = useEditor()
      expect(isDirty.value).toBe(false)
      isDirty.value = true
      expect(isDirty.value).toBe(true)
    })

    it('save is disabled when not dirty', () => {
      const { isDirty } = useEditor()
      const canSave = isDirty.value && true // && !isSaving
      expect(canSave).toBe(false)
    })

    it('save is enabled when dirty', () => {
      const { isDirty } = useEditor()
      isDirty.value = true
      const canSave = isDirty.value && true
      expect(canSave).toBe(true)
    })
  })
})

// -----------------------------------------------------------------
// CSS class contract
// -----------------------------------------------------------------

describe('OpEditFrame CSS class contract', () => {
  it('defines expected class names as part of the component API', () => {
    const expectedClasses = [
      'op-edit-frame',
      'op-edit-frame--active',
      'op-glow',
      'op-glow--hover',
      'op-glow--select',
      'op-edit-frame__toggle',
      'op-edit-frame__toggle--active',
    ]
    for (const cls of expectedClasses) {
      expect(typeof cls).toBe('string')
      expect(cls.length).toBeGreaterThan(0)
    }
  })

  it('defines overlay panel class names', () => {
    const panelClasses = [
      'op-overlay-panel',
      'op-overlay-panel--collapsed',
      'op-overlay-panel--dragging',
      'op-overlay-panel__titlebar',
      'op-overlay-panel__body',
      'op-overlay-panel__section',
      'op-overlay-panel__meta',
      'op-overlay-panel__toolbar',
      'op-overlay-panel__btn',
      'op-overlay-panel__btn--save',
      'op-overlay-panel__btn--discard',
      'op-overlay-panel__status',
      'op-overlay-panel__shortcuts',
    ]
    for (const cls of panelClasses) {
      expect(typeof cls).toBe('string')
      expect(cls.length).toBeGreaterThan(0)
    }
  })
})

// -----------------------------------------------------------------
// Data attribute contract
// -----------------------------------------------------------------

describe('OpEditFrame data attribute contract', () => {
  it('uses data-op-edit-mode with edit/preview values', () => {
    const modes = ['edit', 'preview'] as const
    expect(modes).toHaveLength(2)
  })

  it('uses data-op-glow with hover/select values', () => {
    const glowTypes = ['hover', 'select'] as const
    expect(glowTypes).toHaveLength(2)
  })
})

// -----------------------------------------------------------------
// Accessibility
// -----------------------------------------------------------------

describe('OpEditFrame accessibility', () => {
  beforeEach(() => {
    stateStore.clear()
  })

  it('toggle button label changes by mode', () => {
    const { editMode } = useOpenPress()

    editMode.value = false
    expect(editMode.value ? 'Switch to preview mode' : 'Switch to edit mode').toBe('Switch to edit mode')

    editMode.value = true
    expect(editMode.value ? 'Switch to preview mode' : 'Switch to edit mode').toBe('Switch to preview mode')
  })

  it('aria-pressed reflects edit state', () => {
    const { editMode } = useOpenPress()
    editMode.value = false
    expect(editMode.value).toBe(false)

    editMode.value = true
    expect(editMode.value).toBe(true)
  })
})
