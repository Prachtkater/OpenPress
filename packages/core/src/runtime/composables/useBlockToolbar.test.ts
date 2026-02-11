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
const { useBlockToolbar } = await import('./useBlockToolbar')

// --- Mock HTMLElement for positioning ---

interface MockRect {
  top: number
  left: number
  width: number
  height: number
}

function mockHTMLElement(rect: MockRect, scrollTop = 0, scrollLeft = 0): HTMLElement {
  return {
    getBoundingClientRect: () => ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => {},
    }),
    scrollTop,
    scrollLeft,
  } as unknown as HTMLElement
}

// -----------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------

describe('useBlockToolbar composable', () => {
  beforeEach(() => {
    stateStore.clear()
  })

  describe('initialization', () => {
    it('initializes with no context (hidden)', () => {
      const { context, isVisible } = useBlockToolbar()
      expect(context.value).toBeNull()
      expect(isVisible()).toBe(false)
    })

    it('initializes with empty custom actions', () => {
      const { customActions } = useBlockToolbar()
      expect(customActions.value).toEqual([])
    })
  })

  // -----------------------------------------------------------------
  // show / hide
  // -----------------------------------------------------------------

  describe('show / hide', () => {
    it('show sets the toolbar context', () => {
      const { context, show } = useBlockToolbar()
      const el = mockHTMLElement({ top: 100, left: 50, width: 400, height: 200 })

      show({ elementId: 'block-1', elementType: 'block', element: el })

      expect(context.value).not.toBeNull()
      expect(context.value!.elementId).toBe('block-1')
      expect(context.value!.elementType).toBe('block')
    })

    it('hide clears the context', () => {
      const { context, show, hide } = useBlockToolbar()
      const el = mockHTMLElement({ top: 100, left: 50, width: 400, height: 200 })

      show({ elementId: 'block-1', elementType: 'block', element: el })
      expect(context.value).not.toBeNull()

      hide()
      expect(context.value).toBeNull()
    })

    it('show overwrites previous context', () => {
      const { context, show } = useBlockToolbar()
      const el1 = mockHTMLElement({ top: 100, left: 50, width: 400, height: 200 })
      const el2 = mockHTMLElement({ top: 300, left: 50, width: 400, height: 100 })

      show({ elementId: 'block-1', elementType: 'block', element: el1 })
      show({ elementId: 'block-2', elementType: 'section', element: el2 })

      expect(context.value!.elementId).toBe('block-2')
      expect(context.value!.elementType).toBe('section')
    })

    it('supports all element types', () => {
      const { context, show } = useBlockToolbar()
      const el = mockHTMLElement({ top: 0, left: 0, width: 100, height: 50 })

      for (const type of ['block', 'slot', 'section'] as const) {
        show({ elementId: `id-${type}`, elementType: type, element: el })
        expect(context.value!.elementType).toBe(type)
      }
    })
  })

  // -----------------------------------------------------------------
  // getToolbarPosition
  // -----------------------------------------------------------------

  describe('getToolbarPosition', () => {
    it('calculates position relative to container', () => {
      const { getToolbarPosition } = useBlockToolbar()
      const container = mockHTMLElement({ top: 100, left: 50, width: 800, height: 600 })
      const target = mockHTMLElement({ top: 200, left: 100, width: 400, height: 200 })

      const pos = getToolbarPosition(target, container)

      expect(pos.top).toBe(100) // 200 - 100
      expect(pos.left).toBe(50) // 100 - 50
      expect(pos.width).toBe(400)
    })

    it('accounts for container scroll offset', () => {
      const { getToolbarPosition } = useBlockToolbar()
      const container = mockHTMLElement(
        { top: 0, left: 0, width: 800, height: 600 },
        300, // scrollTop
        50,  // scrollLeft
      )
      const target = mockHTMLElement({ top: -100, left: 20, width: 400, height: 200 })

      const pos = getToolbarPosition(target, container)

      expect(pos.top).toBe(200) // -100 - 0 + 300
      expect(pos.left).toBe(70) // 20 - 0 + 50
      expect(pos.width).toBe(400)
    })

    it('handles zero-offset container', () => {
      const { getToolbarPosition } = useBlockToolbar()
      const container = mockHTMLElement({ top: 0, left: 0, width: 1024, height: 768 })
      const target = mockHTMLElement({ top: 50, left: 100, width: 200, height: 80 })

      const pos = getToolbarPosition(target, container)

      expect(pos.top).toBe(50)
      expect(pos.left).toBe(100)
      expect(pos.width).toBe(200)
    })
  })

  // -----------------------------------------------------------------
  // registerActions
  // -----------------------------------------------------------------

  describe('registerActions', () => {
    it('registers custom actions', () => {
      const { customActions, registerActions } = useBlockToolbar()
      const actions = [
        { id: 'custom-1', label: 'Custom', icon: 'star', handler: () => {} },
      ]

      registerActions(actions)

      expect(customActions.value).toHaveLength(1)
      expect(customActions.value[0].id).toBe('custom-1')
    })

    it('unregister removes actions by id', () => {
      const { customActions, registerActions } = useBlockToolbar()
      const actions = [
        { id: 'custom-1', label: 'Custom 1', icon: 'star', handler: () => {} },
        { id: 'custom-2', label: 'Custom 2', icon: 'heart', handler: () => {} },
      ]

      const unregister = registerActions(actions)
      expect(customActions.value).toHaveLength(2)

      unregister()
      expect(customActions.value).toHaveLength(0)
    })

    it('multiple registrations accumulate', () => {
      const { customActions, registerActions } = useBlockToolbar()

      registerActions([{ id: 'a', label: 'A', icon: 'a', handler: () => {} }])
      registerActions([{ id: 'b', label: 'B', icon: 'b', handler: () => {} }])

      expect(customActions.value).toHaveLength(2)
    })

    it('unregister only removes its own actions', () => {
      const { customActions, registerActions } = useBlockToolbar()

      registerActions([{ id: 'keep', label: 'Keep', icon: 'k', handler: () => {} }])
      const unregister = registerActions([{ id: 'remove', label: 'Remove', icon: 'r', handler: () => {} }])

      expect(customActions.value).toHaveLength(2)
      unregister()
      expect(customActions.value).toHaveLength(1)
      expect(customActions.value[0].id).toBe('keep')
    })
  })

  // -----------------------------------------------------------------
  // getDefaultActions
  // -----------------------------------------------------------------

  describe('getDefaultActions', () => {
    it('returns move-up, move-down, and delete actions', () => {
      const { getDefaultActions } = useBlockToolbar()
      const actions = getDefaultActions(() => {}, () => {}, () => {})

      expect(actions).toHaveLength(3)
      expect(actions[0].id).toBe('move-up')
      expect(actions[1].id).toBe('move-down')
      expect(actions[2].id).toBe('delete')
    })

    it('action handlers call the provided callbacks', () => {
      const { getDefaultActions } = useBlockToolbar()
      const onMoveUp = mock(() => {})
      const onMoveDown = mock(() => {})
      const onDelete = mock(() => {})

      const actions = getDefaultActions(onMoveUp, onMoveDown, onDelete)

      actions[0].handler()
      expect(onMoveUp).toHaveBeenCalledTimes(1)

      actions[1].handler()
      expect(onMoveDown).toHaveBeenCalledTimes(1)

      actions[2].handler()
      expect(onDelete).toHaveBeenCalledTimes(1)
    })
  })

  // -----------------------------------------------------------------
  // Singleton behavior
  // -----------------------------------------------------------------

  describe('singleton behavior', () => {
    it('context is shared across multiple useBlockToolbar() calls', () => {
      const toolbar1 = useBlockToolbar()
      const toolbar2 = useBlockToolbar()
      const el = mockHTMLElement({ top: 0, left: 0, width: 100, height: 50 })

      toolbar1.show({ elementId: 'block-1', elementType: 'block', element: el })
      expect(toolbar2.context.value).not.toBeNull()
      expect(toolbar2.context.value!.elementId).toBe('block-1')
    })

    it('hide from one instance affects the other', () => {
      const toolbar1 = useBlockToolbar()
      const toolbar2 = useBlockToolbar()
      const el = mockHTMLElement({ top: 0, left: 0, width: 100, height: 50 })

      toolbar1.show({ elementId: 'block-1', elementType: 'block', element: el })
      toolbar2.hide()
      expect(toolbar1.context.value).toBeNull()
    })
  })
})
