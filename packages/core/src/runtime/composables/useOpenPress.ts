import { useState } from '#imports'

export function useOpenPress() {
  const editMode = useState<boolean>('openpress:editMode', () => false)

  return {
    editMode,
  }
}
