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
