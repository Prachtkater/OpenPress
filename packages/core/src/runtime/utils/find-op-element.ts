export type OpElementType = 'section' | 'slot' | 'block'

export interface OpElementHit {
  el: HTMLElement
  id: string
  type: OpElementType
}

/**
 * Walks up the DOM from `target` towards `boundary` looking for the closest
 * OpenPress element identified by `data-op-id` and a type attribute.
 *
 * Priority: block > slot > section > generic (data-op-id only)
 */
export function findOpElement(target: EventTarget | null, boundary: HTMLElement | null): OpElementHit | null {
  let current = target as HTMLElement | null
  while (current && current !== boundary) {
    const opId = current.getAttribute('data-op-id')
    if (opId) {
      const blockType = current.getAttribute('data-op-block')
      if (blockType) {
        return { el: current, id: opId, type: 'block' }
      }

      const slotName = current.getAttribute('data-op-slot')
      if (slotName) {
        return { el: current, id: opId, type: 'slot' }
      }

      const sectionType = current.getAttribute('data-op-section')
      if (sectionType) {
        return { el: current, id: opId, type: 'section' }
      }

      // Fallback: element has data-op-id but no type attribute
      return { el: current, id: opId, type: 'block' }
    }
    current = current.parentElement
  }
  return null
}
