import type { Section, Block } from '@openpress/schemas'
import { provide, inject } from '../context'
import { OP_SECTION_KEY, OP_MODE_KEY } from '../keys'

export interface OpSectionUI {
  root?: string
  inner?: string
}

export interface OpSectionProps {
  section: Section
  ui?: OpSectionUI
}

export interface OpSectionState {
  section: Section
  isEditing: boolean
  slots: Record<string, Block[]>
  dataAttributes: {
    'data-op-section': string
    'data-op-id': string
    'data-op-editing'?: ''
  }
}

/**
 * OpSection Setup-Logik.
 * Rendert einen semantischen Container für eine Section und
 * stellt den Section-Kontext für verschachtelte OpSlots bereit.
 */
export function setupOpSection(props: OpSectionProps): OpSectionState {
  const mode = inject<'view' | 'edit'>(OP_MODE_KEY)
  const isEditing = mode === 'edit'

  // Provide Section-Kontext für verschachtelte OpSlots
  provide(OP_SECTION_KEY, props.section)

  const dataAttributes: OpSectionState['dataAttributes'] = {
    'data-op-section': props.section.type,
    'data-op-id': props.section.id,
  }

  if (isEditing) {
    dataAttributes['data-op-editing'] = ''
  }

  return {
    section: props.section,
    isEditing,
    slots: props.section.slots,
    dataAttributes,
  }
}
