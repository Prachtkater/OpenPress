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
const { useTiptapBridge } = await import('./useTiptapBridge')

describe('useTiptapBridge composable', () => {
  beforeEach(() => {
    stateStore.clear()
  })

  // -----------------------------------------------------------------
  // Bridge state initialization
  // -----------------------------------------------------------------

  describe('initialization', () => {
    it('initializes with no active block', () => {
      const { bridgeState } = useTiptapBridge()
      expect(bridgeState.value.activeBlockId).toBeNull()
      expect(bridgeState.value.activeSectionId).toBeNull()
      expect(bridgeState.value.activeSlotName).toBeNull()
    })
  })

  // -----------------------------------------------------------------
  // Block activation / deactivation
  // -----------------------------------------------------------------

  describe('activateBlock / deactivateBlock', () => {
    it('activateBlock sets all bridge state fields', () => {
      const { bridgeState, activateBlock } = useTiptapBridge()
      activateBlock('block-1', 'section-1', 'default')

      expect(bridgeState.value.activeBlockId).toBe('block-1')
      expect(bridgeState.value.activeSectionId).toBe('section-1')
      expect(bridgeState.value.activeSlotName).toBe('default')
    })

    it('deactivateBlock clears all bridge state fields', () => {
      const { bridgeState, activateBlock, deactivateBlock } = useTiptapBridge()
      activateBlock('block-1', 'section-1', 'default')
      deactivateBlock()

      expect(bridgeState.value.activeBlockId).toBeNull()
      expect(bridgeState.value.activeSectionId).toBeNull()
      expect(bridgeState.value.activeSlotName).toBeNull()
    })

    it('activateBlock overwrites previous activation', () => {
      const { bridgeState, activateBlock } = useTiptapBridge()
      activateBlock('block-1', 'section-1', 'default')
      activateBlock('block-2', 'section-2', 'sidebar')

      expect(bridgeState.value.activeBlockId).toBe('block-2')
      expect(bridgeState.value.activeSectionId).toBe('section-2')
      expect(bridgeState.value.activeSlotName).toBe('sidebar')
    })
  })

  // -----------------------------------------------------------------
  // isBlockActive
  // -----------------------------------------------------------------

  describe('isBlockActive', () => {
    it('returns false when no block is active', () => {
      const { isBlockActive } = useTiptapBridge()
      expect(isBlockActive('block-1')).toBe(false)
    })

    it('returns true for the active block', () => {
      const { activateBlock, isBlockActive } = useTiptapBridge()
      activateBlock('block-1', 'section-1', 'default')
      expect(isBlockActive('block-1')).toBe(true)
    })

    it('returns false for a different block', () => {
      const { activateBlock, isBlockActive } = useTiptapBridge()
      activateBlock('block-1', 'section-1', 'default')
      expect(isBlockActive('block-2')).toBe(false)
    })

    it('returns false after deactivation', () => {
      const { activateBlock, deactivateBlock, isBlockActive } = useTiptapBridge()
      activateBlock('block-1', 'section-1', 'default')
      deactivateBlock()
      expect(isBlockActive('block-1')).toBe(false)
    })
  })

  // -----------------------------------------------------------------
  // Content update handlers
  // -----------------------------------------------------------------

  describe('onContentUpdate', () => {
    it('registers a handler', () => {
      const { onContentUpdate } = useTiptapBridge()
      const handler = mock(() => {})
      const unregister = onContentUpdate(handler)
      expect(typeof unregister).toBe('function')
    })

    it('unregister function removes the handler', () => {
      const { onContentUpdate, activateBlock, emitContentUpdate } = useTiptapBridge()
      const handler = mock(() => {})
      const unregister = onContentUpdate(handler)
      unregister()

      activateBlock('block-1', 'section-1', 'default')

      const mockEditor = {
        getJSON: () => ({ type: 'doc', content: [] }),
        getHTML: () => '<p></p>',
      }
      emitContentUpdate(mockEditor as any)

      expect(handler).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------
  // emitContentUpdate
  // -----------------------------------------------------------------

  describe('emitContentUpdate', () => {
    it('calls registered handlers with update payload', () => {
      const { onContentUpdate, activateBlock, emitContentUpdate } = useTiptapBridge()
      const handler = mock(() => {})
      onContentUpdate(handler)

      activateBlock('block-1', 'section-1', 'default')

      const mockEditor = {
        getJSON: () => ({ type: 'doc', content: [{ type: 'paragraph' }] }),
        getHTML: () => '<p>Hello</p>',
      }
      emitContentUpdate(mockEditor as any)

      expect(handler).toHaveBeenCalledTimes(1)
      const update = (handler as any).mock.calls[0][0]
      expect(update.blockId).toBe('block-1')
      expect(update.sectionId).toBe('section-1')
      expect(update.slotName).toBe('default')
      expect(update.content).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] })
      expect(update.html).toBe('<p>Hello</p>')
    })

    it('does not emit when no block is active', () => {
      const { onContentUpdate, emitContentUpdate } = useTiptapBridge()
      const handler = mock(() => {})
      onContentUpdate(handler)

      const mockEditor = {
        getJSON: () => ({ type: 'doc', content: [] }),
        getHTML: () => '<p></p>',
      }
      emitContentUpdate(mockEditor as any)

      expect(handler).not.toHaveBeenCalled()
    })

    it('calls multiple registered handlers', () => {
      const { onContentUpdate, activateBlock, emitContentUpdate } = useTiptapBridge()
      const handler1 = mock(() => {})
      const handler2 = mock(() => {})
      onContentUpdate(handler1)
      onContentUpdate(handler2)

      activateBlock('block-1', 'section-1', 'default')

      const mockEditor = {
        getJSON: () => ({ type: 'doc', content: [] }),
        getHTML: () => '<p></p>',
      }
      emitContentUpdate(mockEditor as any)

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('does not call unregistered handlers', () => {
      const { onContentUpdate, activateBlock, emitContentUpdate } = useTiptapBridge()
      const handler1 = mock(() => {})
      const handler2 = mock(() => {})
      onContentUpdate(handler1)
      const unregister2 = onContentUpdate(handler2)
      unregister2()

      activateBlock('block-1', 'section-1', 'default')

      const mockEditor = {
        getJSON: () => ({ type: 'doc', content: [] }),
        getHTML: () => '<p></p>',
      }
      emitContentUpdate(mockEditor as any)

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------
  // getInitialContent
  // -----------------------------------------------------------------

  describe('getInitialContent', () => {
    it('returns JSONContent when props.content is an object', () => {
      const { getInitialContent } = useTiptapBridge()
      const jsonContent = { type: 'doc', content: [{ type: 'paragraph' }] }
      const result = getInitialContent({ content: jsonContent })
      expect(result).toEqual(jsonContent)
    })

    it('returns HTML string when props.content is a string', () => {
      const { getInitialContent } = useTiptapBridge()
      const result = getInitialContent({ content: '<p>Hello</p>' })
      expect(result).toBe('<p>Hello</p>')
    })

    it('returns default empty doc when props.content is undefined', () => {
      const { getInitialContent } = useTiptapBridge()
      const result = getInitialContent({})
      expect(result).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] })
    })

    it('returns default empty doc when props.content is null', () => {
      const { getInitialContent } = useTiptapBridge()
      const result = getInitialContent({ content: null })
      expect(result).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] })
    })
  })

  // -----------------------------------------------------------------
  // Singleton behavior (shared via useState)
  // -----------------------------------------------------------------

  describe('singleton behavior', () => {
    it('bridge state is shared across multiple useTiptapBridge() calls', () => {
      const bridge1 = useTiptapBridge()
      const bridge2 = useTiptapBridge()

      bridge1.activateBlock('block-1', 'section-1', 'default')
      expect(bridge2.bridgeState.value.activeBlockId).toBe('block-1')
    })

    it('deactivation from one instance affects the other', () => {
      const bridge1 = useTiptapBridge()
      const bridge2 = useTiptapBridge()

      bridge1.activateBlock('block-1', 'section-1', 'default')
      bridge2.deactivateBlock()
      expect(bridge1.bridgeState.value.activeBlockId).toBeNull()
    })
  })
})
