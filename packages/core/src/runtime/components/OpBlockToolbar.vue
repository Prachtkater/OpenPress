<script setup lang="ts">
/**
 * OpBlockToolbar — Floating Block Toolbar
 *
 * A contextual toolbar that appears above the selected block in edit mode.
 * Provides actions like move up, move down, delete, and extensible custom actions.
 * Positioned dynamically relative to the OpEditFrame container.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useOpenPress } from '../composables/useOpenPress'
import { useEditor } from '../composables/useEditor'
import { useBlockToolbar } from '../composables/useBlockToolbar'
import type { ToolbarPosition, ToolbarAction } from '../composables/useBlockToolbar'

const props = defineProps<{
  /** The OpEditFrame container element (for relative positioning) */
  containerEl: HTMLElement | null
}>()

const emit = defineEmits<{
  (e: 'action', actionId: string): void
  (e: 'move-up'): void
  (e: 'move-down'): void
  (e: 'delete'): void
}>()

const { editMode } = useOpenPress()
const { selectedElement } = useEditor()
const { context, isVisible, customActions, hide, getToolbarPosition } = useBlockToolbar()

const toolbarRef = ref<HTMLElement | null>(null)
const position = ref<ToolbarPosition | null>(null)

// Toolbar height offset — positions the toolbar above the element
const TOOLBAR_OFFSET = 8

const toolbarStyle = computed(() => {
  if (!position.value || !isVisible() || !editMode.value) return null
  const p = position.value
  return {
    position: 'absolute' as const,
    top: `${p.top - TOOLBAR_OFFSET}px`,
    left: `${p.left}px`,
    width: `${p.width}px`,
    transform: 'translateY(-100%)',
    pointerEvents: 'auto' as const,
  }
})

// Default actions: move up, move down, delete
const defaultActions = computed<ToolbarAction[]>(() => {
  if (!context.value || context.value.elementType !== 'block') return []
  return [
    {
      id: 'move-up',
      label: 'Move up',
      icon: 'arrow-up',
      handler: () => emit('move-up'),
    },
    {
      id: 'move-down',
      label: 'Move down',
      icon: 'arrow-down',
      handler: () => emit('move-down'),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      handler: () => emit('delete'),
    },
  ]
})

const allActions = computed(() => [
  ...defaultActions.value,
  ...customActions.value,
])

function handleAction(action: ToolbarAction) {
  action.handler()
  emit('action', action.id)
}

function updatePosition() {
  if (!context.value?.element || !props.containerEl) {
    position.value = null
    return
  }
  position.value = getToolbarPosition(context.value.element, props.containerEl)
}

// Update position when context changes
watch(context, () => {
  updatePosition()
}, { deep: true })

// Update position on scroll/resize
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)

  if (props.containerEl) {
    resizeObserver = new ResizeObserver(updatePosition)
    resizeObserver.observe(props.containerEl)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
  resizeObserver?.disconnect()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="toolbarStyle && allActions.length > 0"
      ref="toolbarRef"
      class="op-block-toolbar"
      :style="toolbarStyle"
      data-op-toolbar
      @mousedown.stop
      @click.stop
    >
      <div class="op-block-toolbar__inner">
        <!-- Block type label -->
        <span
          v-if="context"
          class="op-block-toolbar__label"
        >
          {{ context.elementType }}
        </span>

        <span class="op-block-toolbar__divider" />

        <!-- Action buttons -->
        <button
          v-for="action in allActions"
          :key="action.id"
          class="op-block-toolbar__button"
          :class="{ 'op-block-toolbar__button--danger': action.id === 'delete' }"
          type="button"
          :title="action.label"
          :disabled="action.disabled"
          :data-op-toolbar-action="action.id"
          @click.stop="handleAction(action)"
        >
          <!-- SVG icons inline -->
          <svg
            v-if="action.icon === 'arrow-up'"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m5 12 7-7 7 7" />
            <path d="M12 19V5" />
          </svg>

          <svg
            v-else-if="action.icon === 'arrow-down'"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>

          <svg
            v-else-if="action.icon === 'trash'"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>

          <!-- Fallback: text label -->
          <span v-else class="op-block-toolbar__icon-text">{{ action.label.charAt(0) }}</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style>
/* ===== OpBlockToolbar Base ===== */
.op-block-toolbar {
  z-index: 9999;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.op-block-toolbar__inner {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.04);
  pointer-events: auto;
}

/* ===== Label ===== */
.op-block-toolbar__label {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  padding: 0 4px;
  text-transform: capitalize;
  user-select: none;
}

/* ===== Divider ===== */
.op-block-toolbar__divider {
  width: 1px;
  height: 16px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 2px;
}

/* ===== Action Buttons ===== */
.op-block-toolbar__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.op-block-toolbar__button:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.op-block-toolbar__button:active {
  background: rgba(59, 130, 246, 0.2);
}

.op-block-toolbar__button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.op-block-toolbar__button--danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.op-block-toolbar__icon-text {
  font-size: 12px;
  font-weight: 600;
}

/* ===== Dark Mode ===== */
@media (prefers-color-scheme: dark) {
  .op-block-toolbar__inner {
    background: rgba(30, 41, 59, 0.97);
    border-color: rgba(59, 130, 246, 0.3);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.06);
  }

  .op-block-toolbar__label {
    color: #94a3b8;
  }

  .op-block-toolbar__divider {
    background: rgba(255, 255, 255, 0.1);
  }

  .op-block-toolbar__button {
    color: #cbd5e1;
  }

  .op-block-toolbar__button:hover {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }

  .op-block-toolbar__button--danger:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
}
</style>
