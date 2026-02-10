import { inject } from '../context'
import { OP_SLOT_KEY, type OpSlotContext } from '../keys'

export interface UseOpSlotReturn {
  slot: OpSlotContext
}

/**
 * Zugriff auf den Slot-Kontext.
 * Muss innerhalb einer OpSlot-Komponente aufgerufen werden.
 */
export function useOpSlot(): UseOpSlotReturn {
  const slot = inject<OpSlotContext>(OP_SLOT_KEY)

  if (!slot) {
    throw new Error(
      '[OpenPress] useOpSlot() muss innerhalb von <OpSlot> aufgerufen werden.'
    )
  }

  return { slot }
}
