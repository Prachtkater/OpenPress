import type { Block, Section } from '@openpress/schemas'
import { provide, inject } from '../context'
import { OP_SLOT_KEY, OP_SECTION_KEY, OP_MODE_KEY, type OpSlotContext } from '../keys'
import { resolveBlockComponent, type BlockComponentDef } from '../blocks/resolve'

export interface OpSlotUI {
  root?: string
  empty?: string
}

export interface OpSlotProps {
  name: string
  blocks: Block[]
  ui?: OpSlotUI
}

export interface ResolvedBlock {
  block: Block
  component: BlockComponentDef
}

export interface OpSlotState {
  name: string
  blocks: Block[]
  resolvedBlocks: ResolvedBlock[]
  isEmpty: boolean
  isEditing: boolean
  slotContext: OpSlotContext
  dataAttributes: {
    'data-op-slot': string
    'data-op-editing'?: ''
  }
}

/**
 * OpSlot Setup-Logik.
 * Rendert einen Container für eine geordnete Liste von Blocks.
 * Löst Block-Types auf registrierte Komponenten auf.
 */
export function setupOpSlot(props: OpSlotProps): OpSlotState {
  const section = inject<Section>(OP_SECTION_KEY)
  const mode = inject<'view' | 'edit'>(OP_MODE_KEY)
  const isEditing = mode === 'edit'

  if (!section) {
    throw new Error(
      '[OpenPress] OpSlot muss innerhalb von <OpSection> verwendet werden.'
    )
  }

  const slotContext: OpSlotContext = {
    name: props.name,
    sectionId: section.id,
  }

  // Provide Slot-Kontext für verschachtelte Blocks
  provide(OP_SLOT_KEY, slotContext)

  // Blocks auf registrierte Komponenten auflösen
  const resolvedBlocks: ResolvedBlock[] = props.blocks.map((block) => ({
    block,
    component: resolveBlockComponent(block.type),
  }))

  const dataAttributes: OpSlotState['dataAttributes'] = {
    'data-op-slot': props.name,
  }

  if (isEditing) {
    dataAttributes['data-op-editing'] = ''
  }

  return {
    name: props.name,
    blocks: props.blocks,
    resolvedBlocks,
    isEmpty: props.blocks.length === 0,
    isEditing,
    slotContext,
    dataAttributes,
  }
}
