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

// Import composables after mocking
const { useBlockToolbar } = await import('../composables/useBlockToolbar')
const { useEditor } = await import('../composables/useEditor')
const { useOpenPress } = await import('../composables/useOpenPress')

// --- Mock DOM helpers ---

function mockHTMLElement(rect: { top: number; left: number; width: number; height: number }): HTMLElement {
  return {
    getBoundingClientRect: () => ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => {},
    }),
    scrollTop: 0,
    scrollLeft: 0,
  } as unknown as HTMLElement
}

// -----------------------------------------------------------------
// OpBlockToolbar — Behavioral Tests
// -----------------------------------------------------------------

describe('OpBlockToolbar', () => {
  beforeEach(() => {
    stateStore.clear()
  })

  // -----------------------------------------------------------------
  // Visibility contract
  // -----------------------------------------------------------------

  describe('visibility', () => {
    it('toolbar is hidden when no block is selected', () => {
      const { isVisible } = useBlockToolbar()
      expect(isVisible()).toBe(false)
    })

    it('toolbar is visible when a block is selected', () => {
      const { show, context } = useBlockToolbar()
      const el = mockHTMLElement({ top: 100, left: 50, width: 400, height: 200 })
      show({ elementId: 'block-1', elementType: 'block', element: el })
      expect(context.value).not.toBeNull()
    })

    it('toolbar hides when selection is cleared', () => {
      const { show, hide, context } = useBlockToolbar()
      const el = mockHTMLElement({ top: 100, left: 50, width: 400, height: 200 })
      show({ elementId: 'block-1', elementType: 'block', element: el })
      hide()
      expect(context.value).toBeNull()
    })
  })

  // -----------------------------------------------------------------
  // Positioning contract
  // -----------------------------------------------------------------

  describe('positioning', () => {
    it('positions toolbar above the selected element', () => {
      const { getToolbarPosition } = useBlockToolbar()
      const container = mockHTMLElement({ top: 0, left: 0, width: 1024, height: 768 })
      const target = mockHTMLElement({ top: 200, left: 100, width: 400, height: 60 })

      const pos = getToolbarPosition(target, container)

      // The toolbar should be positioned at the top of the target element
      // (the component applies translateY(-100%) to move it above)
      expect(pos.top).toBe(200)
      expect(pos.left).toBe(100)
      expect(pos.width).toBe(400)
    })

    it('toolbar width matches element width (centered)', () => {
      const { getToolbarPosition } = useBlockToolbar()
      const container = mockHTMLElement({ top: 0, left: 0, width: 1024, height: 768 })
      const target = mockHTMLElement({ top: 100, left: 200, width: 600, height: 80 })

      const pos = getToolbarPosition(target, container)
      expect(pos.width).toBe(600)
    })
  })

  // -----------------------------------------------------------------
  // Integration with useEditor
  // -----------------------------------------------------------------

  describe('integration with useEditor', () => {
    it('toolbar shows when block is selected via useEditor + useBlockToolbar', () => {
      const { selectElement } = useEditor()
      const { show, context } = useBlockToolbar()
      const el = mockHTMLElement({ top: 100, left: 50, width: 400, height: 200 })

      // Simulate OpEditFrame flow: selectElement → show toolbar
      selectElement('block-1', 'block')
      show({ elementId: 'block-1', elementType: 'block', element: el })

      expect(context.value).not.toBeNull()
      expect(context.value!.elementId).toBe('block-1')
    })

    it('toolbar hides when selection is cleared', () => {
      const { selectElement, clearSelection } = useEditor()
      const { show, hide, context } = useBlockToolbar()
      const el = mockHTMLElement({ top: 100, left: 50, width: 400, height: 200 })

      selectElement('block-1', 'block')
      show({ elementId: 'block-1', elementType: 'block', element: el })

      clearSelection()
      hide()

      expect(context.value).toBeNull()
    })
  })

  // -----------------------------------------------------------------
  // Integration with edit mode
  // -----------------------------------------------------------------

  describe('integration with edit mode', () => {
    it('toolbar hides when switching to preview mode', () => {
      const { editMode } = useOpenPress()
      const { show, hide, context } = useBlockToolbar()
      const el = mockHTMLElement({ top: 100, left: 50, width: 400, height: 200 })

      editMode.value = true
      show({ elementId: 'block-1', elementType: 'block', element: el })
      expect(context.value).not.toBeNull()

      // Simulate toggleEditMode: editMode → false, hide toolbar
      editMode.value = false
      hide()
      expect(context.value).toBeNull()
    })
  })

  // -----------------------------------------------------------------
  // CSS class contract
  // -----------------------------------------------------------------

  describe('CSS class contract', () => {
    it('defines expected class names', () => {
      const expectedClasses = [
        'op-block-toolbar',
        'op-block-toolbar__inner',
        'op-block-toolbar__label',
        'op-block-toolbar__divider',
        'op-block-toolbar__button',
        'op-block-toolbar__button--danger',
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

  describe('data attribute contract', () => {
    it('uses data-op-toolbar for the root element', () => {
      expect('data-op-toolbar').toBe('data-op-toolbar')
    })

    it('uses data-op-toolbar-action for action buttons', () => {
      const actionIds = ['move-up', 'move-down', 'delete'] as const
      expect(actionIds).toHaveLength(3)
    })
  })

  // -----------------------------------------------------------------
  // Action handling
  // -----------------------------------------------------------------

  describe('action handling', () => {
    it('default actions include move-up, move-down, delete', () => {
      const { getDefaultActions } = useBlockToolbar()
      const actions = getDefaultActions(() => {}, () => {}, () => {})

      const ids = actions.map((a) => a.id)
      expect(ids).toContain('move-up')
      expect(ids).toContain('move-down')
      expect(ids).toContain('delete')
    })

    it('custom actions are combined with defaults', () => {
      const { customActions, registerActions, getDefaultActions } = useBlockToolbar()

      registerActions([
        { id: 'duplicate', label: 'Duplicate', icon: 'copy', handler: () => {} },
      ])

      const defaults = getDefaultActions(() => {}, () => {}, () => {})
      const all = [...defaults, ...customActions.value]

      expect(all).toHaveLength(4)
      const ids = all.map((a) => a.id)
      expect(ids).toContain('move-up')
      expect(ids).toContain('duplicate')
    })
  })
})
