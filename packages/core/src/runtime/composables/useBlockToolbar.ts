import { useState } from '#imports'
import type { OpElementType } from '../utils/find-op-element'

export interface ToolbarAction {
  id: string
  label: string
  icon: string
  /** Action handler — receives the selected element context */
  handler: () => void
  /** Whether this action is currently disabled */
  disabled?: boolean
}

export interface ToolbarPosition {
  top: number
  left: number
  width: number
}

export interface ToolbarContext {
  /** The selected element's ID */
  elementId: string
  /** The selected element's type */
  elementType: OpElementType
  /** The DOM element (for positioning) */
  element: HTMLElement
}

/**
 * useBlockToolbar — Composable for the floating block toolbar.
 *
 * Manages toolbar visibility, position, and available actions.
 * The toolbar appears when a block (or section/slot) is selected in edit mode,
 * positioned directly above the selected element's glow overlay.
 */
export function useBlockToolbar() {
  const context = useState<ToolbarContext | null>(
    'openpress:toolbar:context',
    () => null,
  )

  const customActions = useState<ToolbarAction[]>(
    'openpress:toolbar:actions',
    () => [],
  )

  /**
   * Whether the toolbar is currently visible (has a context).
   */
  function isVisible(): boolean {
    return context.value !== null
  }

  /**
   * Show the toolbar for a given element.
   */
  function show(ctx: ToolbarContext) {
    context.value = ctx
  }

  /**
   * Hide the toolbar.
   */
  function hide() {
    context.value = null
  }

  /**
   * Calculate the toolbar position relative to a container element.
   * Positions the toolbar centered above the target element.
   */
  function getToolbarPosition(
    targetEl: HTMLElement,
    containerEl: HTMLElement,
  ): ToolbarPosition {
    const containerRect = containerEl.getBoundingClientRect()
    const targetRect = targetEl.getBoundingClientRect()

    return {
      top: targetRect.top - containerRect.top + containerEl.scrollTop,
      left: targetRect.left - containerRect.left + containerEl.scrollLeft,
      width: targetRect.width,
    }
  }

  /**
   * Register custom toolbar actions (e.g. from features/plugins).
   * Returns an unregister function.
   */
  function registerActions(actions: ToolbarAction[]): () => void {
    customActions.value.push(...actions)
    return () => {
      for (const action of actions) {
        const idx = customActions.value.findIndex((a: ToolbarAction) => a.id === action.id)
        if (idx !== -1) {
          customActions.value.splice(idx, 1)
        }
      }
    }
  }

  /**
   * Get default block actions (move up, move down, delete).
   */
  function getDefaultActions(onMoveUp: () => void, onMoveDown: () => void, onDelete: () => void): ToolbarAction[] {
    return [
      {
        id: 'move-up',
        label: 'Move up',
        icon: 'arrow-up',
        handler: onMoveUp,
      },
      {
        id: 'move-down',
        label: 'Move down',
        icon: 'arrow-down',
        handler: onMoveDown,
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'trash',
        handler: onDelete,
      },
    ]
  }

  return {
    context,
    customActions,
    isVisible,
    show,
    hide,
    getToolbarPosition,
    registerActions,
    getDefaultActions,
  }
}
