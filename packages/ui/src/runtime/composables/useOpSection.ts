import type { Section } from '@openpress/schemas'
import { inject } from '../context'
import { OP_SECTION_KEY } from '../keys'

export interface UseOpSectionReturn {
  section: Section
}

/**
 * Zugriff auf den Section-Kontext.
 * Muss innerhalb einer OpSection-Komponente aufgerufen werden.
 */
export function useOpSection(): UseOpSectionReturn {
  const section = inject<Section>(OP_SECTION_KEY)

  if (!section) {
    throw new Error(
      '[OpenPress] useOpSection() muss innerhalb von <OpSection> aufgerufen werden.'
    )
  }

  return { section }
}
