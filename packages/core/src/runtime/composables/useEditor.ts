import { useState } from '#imports'
import type { OpElementType } from '../utils/find-op-element'

export type { OpElementType }

export interface OpSelectedElement {
  id: string
  type: OpElementType
}

export function useEditor() {
  const isDirty = useState<boolean>('openpress:editor:dirty', () => false)
  const selectedBlockId = useState<string | null>('openpress:editor:selectedBlock', () => null)
  const selectedElement = useState<OpSelectedElement | null>('openpress:editor:selected', () => null)
  const hoveredElement = useState<OpSelectedElement | null>('openpress:editor:hovered', () => null)
  /** Whether an inline Tiptap editor is currently focused */
  const inlineEditing = useState<boolean>('openpress:editor:inlineEditing', () => false)

  function selectElement(id: string, type: OpElementType) {
    selectedElement.value = { id, type }
    if (type === 'block') {
      selectedBlockId.value = id
    }
  }

  function clearSelection() {
    selectedElement.value = null
    selectedBlockId.value = null
    inlineEditing.value = false
  }

  function hoverElement(id: string, type: OpElementType) {
    hoveredElement.value = { id, type }
  }

  function clearHover() {
    hoveredElement.value = null
  }

  function setInlineEditing(active: boolean) {
    inlineEditing.value = active
  }

  return {
    isDirty,
    selectedBlockId,
    selectedElement,
    hoveredElement,
    inlineEditing,
    selectElement,
    clearSelection,
    hoverElement,
    clearHover,
    setInlineEditing,
  }
}
