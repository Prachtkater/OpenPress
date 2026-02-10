import { useState } from '#imports'

export function useEditor() {
  const isDirty = useState<boolean>('openpress:editor:dirty', () => false)
  const selectedBlockId = useState<string | null>('openpress:editor:selectedBlock', () => null)

  return {
    isDirty,
    selectedBlockId,
  }
}
