import { useState } from '#imports'
import type { Editor, JSONContent } from '@tiptap/core'
import { ref } from 'vue'

export interface TiptapBridgeState {
  /** The block ID currently being edited inline */
  activeBlockId: string | null
  /** The section ID the active block belongs to */
  activeSectionId: string | null
  /** The slot name the active block belongs to */
  activeSlotName: string | null
}

export interface BlockContentUpdate {
  blockId: string
  sectionId: string
  slotName: string
  content: JSONContent
  html: string
}

export type ContentUpdateHandler = (update: BlockContentUpdate) => void

/**
 * useTiptapBridge — Composable that bridges Tiptap inline editing
 * with the OpenPress Op-system (OpProvider/OpSlot).
 *
 * Manages which block is currently being edited inline,
 * captures Tiptap content changes, and dispatches them as
 * structured updates back to the content layer.
 */
export function useTiptapBridge() {
  const bridgeState = useState<TiptapBridgeState>('openpress:tiptap:bridge', () => ({
    activeBlockId: null,
    activeSectionId: null,
    activeSlotName: null,
  }))

  const contentUpdateHandlers = useState<ContentUpdateHandler[]>(
    'openpress:tiptap:handlers',
    () => [],
  )

  /** The Tiptap editor instance of the currently active block */
  const activeEditor = useState<Editor | null>('openpress:tiptap:activeEditor', () => null)

  /**
   * Activate inline editing for a specific block.
   */
  function activateBlock(blockId: string, sectionId: string, slotName: string, editor?: Editor) {
    bridgeState.value = {
      activeBlockId: blockId,
      activeSectionId: sectionId,
      activeSlotName: slotName,
    }
    if (editor) {
      activeEditor.value = editor
    }
  }

  /**
   * Deactivate inline editing (e.g. on blur or Escape).
   */
  function deactivateBlock() {
    bridgeState.value = {
      activeBlockId: null,
      activeSectionId: null,
      activeSlotName: null,
    }
    activeEditor.value = null
  }

  /**
   * Check if a specific block is currently being edited.
   */
  function isBlockActive(blockId: string): boolean {
    return bridgeState.value.activeBlockId === blockId
  }

  /**
   * Register a handler that receives content updates when Tiptap content changes.
   * Returns an unregister function.
   */
  function onContentUpdate(handler: ContentUpdateHandler): () => void {
    contentUpdateHandlers.value.push(handler)
    return () => {
      const idx = contentUpdateHandlers.value.indexOf(handler)
      if (idx !== -1) {
        contentUpdateHandlers.value.splice(idx, 1)
      }
    }
  }

  /**
   * Emit a content update from Tiptap editor to all registered handlers.
   * Called by OpInlineEdit when the Tiptap editor content changes.
   */
  function emitContentUpdate(editor: Editor) {
    const { activeBlockId, activeSectionId, activeSlotName } = bridgeState.value
    if (!activeBlockId || !activeSectionId || !activeSlotName) return

    const update: BlockContentUpdate = {
      blockId: activeBlockId,
      sectionId: activeSectionId,
      slotName: activeSlotName,
      content: editor.getJSON(),
      html: editor.getHTML(),
    }

    for (const handler of contentUpdateHandlers.value) {
      handler(update)
    }
  }

  /**
   * Create initial Tiptap JSONContent from a block's props.
   * Expects `props.content` to be either a JSONContent object or an HTML string.
   */
  function getInitialContent(props: Record<string, unknown>): JSONContent | string {
    if (props.content && typeof props.content === 'object') {
      return props.content as JSONContent
    }
    if (typeof props.content === 'string') {
      return props.content
    }
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }

  return {
    bridgeState,
    activeEditor,
    activateBlock,
    deactivateBlock,
    isBlockActive,
    onContentUpdate,
    emitContentUpdate,
    getInitialContent,
  }
}

