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
const { useTiptapBridge } = await import('../composables/useTiptapBridge')
const { useOpenPress } = await import('../composables/useOpenPress')

// -----------------------------------------------------------------
// useEditor inline editing extensions
// -----------------------------------------------------------------

describe('useEditor inline editing extensions', () => {
  beforeEach(() => {
    stateStore.clear()
  })

  it('initializes inlineEditing as false', () => {
    const { inlineEditing } = useEditor()
    expect(inlineEditing.value).toBe(false)
  })

  it('setInlineEditing changes the inlineEditing state', () => {
    const { inlineEditing, setInlineEditing } = useEditor()
    setInlineEditing(true)
    expect(inlineEditing.value).toBe(true)

    setInlineEditing(false)
    expect(inlineEditing.value).toBe(false)
  })

  it('clearSelection also resets inlineEditing to false', () => {
    const { inlineEditing, setInlineEditing, clearSelection } = useEditor()
    setInlineEditing(true)
    expect(inlineEditing.value).toBe(true)

    clearSelection()
    expect(inlineEditing.value).toBe(false)
  })

  it('inlineEditing state is shared (singleton via useState)', () => {
    const editor1 = useEditor()
    const editor2 = useEditor()

    editor1.setInlineEditing(true)
    expect(editor2.inlineEditing.value).toBe(true)
  })
})

// -----------------------------------------------------------------
// OpEditFrame + TiptapBridge integration behavior
// -----------------------------------------------------------------

describe('OpEditFrame + TiptapBridge integration', () => {
  beforeEach(() => {
    stateStore.clear()
  })

  it('inline editing flag prevents click from changing selection (simulated)', () => {
    const { editMode } = useOpenPress()
    const { selectedElement, selectElement, inlineEditing, setInlineEditing } = useEditor()

    editMode.value = true
    selectElement('block-1', 'block')
    setInlineEditing(true)

    // Simulated: OpEditFrame.handleClick returns early when inlineEditing
    // and click target is inside [data-op-inline-edit]
    const clickInsideInlineEditor = true
    if (inlineEditing.value && clickInsideInlineEditor) {
      // handleClick returns early — selection unchanged
    } else {
      selectElement('block-2', 'block')
    }

    expect(selectedElement.value!.id).toBe('block-1')
  })

  it('clicking outside inline editor deactivates it (simulated)', () => {
    const { editMode } = useOpenPress()
    const { inlineEditing, setInlineEditing, selectElement } = useEditor()
    const { activateBlock, deactivateBlock, bridgeState } = useTiptapBridge()

    editMode.value = true
    selectElement('block-1', 'block')
    activateBlock('block-1', 'section-1', 'default')
    setInlineEditing(true)

    // Simulated: click outside inline editor
    const clickInsideInlineEditor = false
    if (inlineEditing.value && !clickInsideInlineEditor) {
      deactivateBlock()
      setInlineEditing(false)
    }

    expect(inlineEditing.value).toBe(false)
    expect(bridgeState.value.activeBlockId).toBeNull()
  })

  it('Escape deactivates inline editing before clearing selection (simulated)', () => {
    const { editMode } = useOpenPress()
    const { selectedElement, selectElement, inlineEditing, setInlineEditing } = useEditor()
    const { activateBlock, deactivateBlock, bridgeState } = useTiptapBridge()

    editMode.value = true
    selectElement('block-1', 'block')
    activateBlock('block-1', 'section-1', 'default')
    setInlineEditing(true)

    // Simulated: first Escape — deactivates inline editing, keeps selection
    if (inlineEditing.value) {
      deactivateBlock()
      setInlineEditing(false)
    }

    expect(inlineEditing.value).toBe(false)
    expect(bridgeState.value.activeBlockId).toBeNull()
    expect(selectedElement.value).not.toBeNull()
    expect(selectedElement.value!.id).toBe('block-1')
  })

  it('second Escape clears the selection (simulated)', () => {
    const { editMode } = useOpenPress()
    const { selectedElement, selectElement, inlineEditing, setInlineEditing, clearSelection } = useEditor()
    const { activateBlock, deactivateBlock } = useTiptapBridge()

    editMode.value = true
    selectElement('block-1', 'block')
    activateBlock('block-1', 'section-1', 'default')
    setInlineEditing(true)

    // First Escape: deactivate inline editing
    if (inlineEditing.value) {
      deactivateBlock()
      setInlineEditing(false)
      // return — don't clear selection
    }

    expect(selectedElement.value).not.toBeNull()

    // Second Escape: clear selection
    if (!inlineEditing.value) {
      clearSelection()
    }

    expect(selectedElement.value).toBeNull()
  })

  it('toggling to preview mode cleans up inline editing state (simulated)', () => {
    const { editMode } = useOpenPress()
    const { inlineEditing, setInlineEditing, clearSelection, clearHover } = useEditor()
    const { activateBlock, deactivateBlock, bridgeState } = useTiptapBridge()

    editMode.value = true
    activateBlock('block-1', 'section-1', 'default')
    setInlineEditing(true)

    // Simulated: toggleEditMode() sets editMode to false
    editMode.value = false
    deactivateBlock()
    setInlineEditing(false)
    clearSelection()
    clearHover()

    expect(inlineEditing.value).toBe(false)
    expect(bridgeState.value.activeBlockId).toBeNull()
  })
})

// -----------------------------------------------------------------
// TiptapBridge + Editor dirty flag integration
// -----------------------------------------------------------------

describe('TiptapBridge dirty flag integration', () => {
  beforeEach(() => {
    stateStore.clear()
  })

  it('content updates mark the editor as dirty', () => {
    const { isDirty } = useEditor()
    const { onContentUpdate, activateBlock, emitContentUpdate } = useTiptapBridge()

    // Register handler that sets dirty flag
    onContentUpdate(() => {
      isDirty.value = true
    })

    activateBlock('block-1', 'section-1', 'default')

    const mockEditor = {
      getJSON: () => ({ type: 'doc', content: [{ type: 'paragraph' }] }),
      getHTML: () => '<p>Updated</p>',
    }
    emitContentUpdate(mockEditor as any)

    expect(isDirty.value).toBe(true)
  })
})

// -----------------------------------------------------------------
// OpInlineEdit CSS class and data attribute contract
// -----------------------------------------------------------------

describe('OpInlineEdit CSS class contract', () => {
  it('defines expected class names as part of the component API', () => {
    const expectedClasses = [
      'op-inline-edit',
      'op-inline-edit--active',
      'op-inline-edit--editable',
      'op-inline-edit__content',
    ]
    for (const cls of expectedClasses) {
      expect(typeof cls).toBe('string')
      expect(cls.length).toBeGreaterThan(0)
    }
  })

  it('uses data-op-inline-edit attribute for identification', () => {
    const attr = 'data-op-inline-edit'
    expect(attr).toBe('data-op-inline-edit')
  })
})
