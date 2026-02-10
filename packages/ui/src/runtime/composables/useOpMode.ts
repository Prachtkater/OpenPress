import { inject } from '../context'
import { OP_MODE_KEY } from '../keys'

export interface UseOpModeReturn {
  mode: 'view' | 'edit'
  isEditing: boolean
}

/**
 * Schmalerer Zugriff nur auf den Editor-Modus.
 * Für Komponenten die nicht den ganzen State brauchen.
 */
export function useOpMode(): UseOpModeReturn {
  const mode = inject<'view' | 'edit'>(OP_MODE_KEY)

  if (mode === undefined) {
    throw new Error(
      '[OpenPress] useOpMode() muss innerhalb von <OpProvider> aufgerufen werden.'
    )
  }

  return {
    mode,
    isEditing: mode === 'edit',
  }
}
