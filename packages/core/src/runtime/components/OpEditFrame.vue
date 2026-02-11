<script setup lang="ts">
/**
 * OpEditFrame — The Glow Frame
 *
 * Editor overlay that wraps content and provides In-Context Editing functionality.
 * In preview mode, renders content without decoration.
 * In edit mode, attaches event listeners for hover/select interactions
 * and renders a luminous 1-2px border overlay (the "Glow") around hovered/selected elements.
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useOpenPress } from '../composables/useOpenPress'
import { useEditor } from '../composables/useEditor'
import { useTiptapBridge } from '../composables/useTiptapBridge'
import { useBlockToolbar } from '../composables/useBlockToolbar'
import { findOpElement } from '../utils/find-op-element'

const { editMode } = useOpenPress()
const {
  selectedElement,
  hoveredElement,
  inlineEditing,
  selectElement,
  clearSelection,
  hoverElement,
  clearHover,
  setInlineEditing,
} = useEditor()
const { deactivateBlock } = useTiptapBridge()
const { show: showToolbar, hide: hideToolbar } = useBlockToolbar()

defineEmits<{
  (e: 'block-move-up'): void
  (e: 'block-move-down'): void
  (e: 'block-delete'): void
}>()

const frameRef = ref<HTMLElement | null>(null)

// --- Glow overlay positioning ---

interface GlowRect {
  top: number
  left: number
  width: number
  height: number
}

const hoverGlow = ref<GlowRect | null>(null)
const selectGlow = ref<GlowRect | null>(null)

function getGlowRect(el: HTMLElement): GlowRect {
  const containerEl = frameRef.value
  if (!containerEl) return { top: 0, left: 0, width: 0, height: 0 }

  const containerRect = containerEl.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()

  return {
    top: elRect.top - containerRect.top + containerEl.scrollTop,
    left: elRect.left - containerRect.left + containerEl.scrollLeft,
    width: elRect.width,
    height: elRect.height,
  }
}

// --- Event handlers ---

function handleMouseMove(e: MouseEvent) {
  if (!editMode.value) return

  const found = findOpElement(e.target, frameRef.value)
  if (found) {
    hoverElement(found.id, found.type)
    hoverGlow.value = getGlowRect(found.el)
  } else {
    clearHover()
    hoverGlow.value = null
  }
}

function handleClick(e: MouseEvent) {
  if (!editMode.value) return

  // Don't intercept clicks when a Tiptap inline editor is active —
  // let the editor handle its own focus/selection events
  if (inlineEditing.value) {
    const target = e.target as HTMLElement | null
    if (target?.closest('[data-op-inline-edit]')) {
      return
    }
    // Clicked outside the inline editor — deactivate it
    deactivateBlock()
    setInlineEditing(false)
  }

  const found = findOpElement(e.target, frameRef.value)
  if (found) {
    e.preventDefault()
    e.stopPropagation()
    selectElement(found.id, found.type)
    selectGlow.value = getGlowRect(found.el)
    showToolbar({ elementId: found.id, elementType: found.type, element: found.el })
  } else {
    clearSelection()
    selectGlow.value = null
    hideToolbar()
  }
}

function handleMouseLeave() {
  if (!editMode.value) return
  clearHover()
  hoverGlow.value = null
}

function handleKeyDown(e: KeyboardEvent) {
  if (!editMode.value) return

  if (e.key === 'Escape') {
    // If inline editing is active, deactivate it first (don't clear selection)
    if (inlineEditing.value) {
      deactivateBlock()
      setInlineEditing(false)
      return
    }
    clearSelection()
    selectGlow.value = null
    hideToolbar()
  }
}

// --- Toggle edit mode ---

function toggleEditMode() {
  editMode.value = !editMode.value
  if (!editMode.value) {
    deactivateBlock()
    setInlineEditing(false)
    clearSelection()
    clearHover()
    hoverGlow.value = null
    selectGlow.value = null
    hideToolbar()
  }
}

// --- Glow style computation ---

const hoverGlowStyle = computed(() => {
  if (!hoverGlow.value || !editMode.value) return null
  // Don't show hover glow on the selected element
  if (selectedElement.value && hoveredElement.value &&
      selectedElement.value.id === hoveredElement.value.id) {
    return null
  }
  const g = hoverGlow.value
  return {
    position: 'absolute' as const,
    top: `${g.top}px`,
    left: `${g.left}px`,
    width: `${g.width}px`,
    height: `${g.height}px`,
    pointerEvents: 'none' as const,
  }
})

const selectGlowStyle = computed(() => {
  if (!selectGlow.value || !editMode.value) return null
  const g = selectGlow.value
  return {
    position: 'absolute' as const,
    top: `${g.top}px`,
    left: `${g.left}px`,
    width: `${g.width}px`,
    height: `${g.height}px`,
    pointerEvents: 'none' as const,
  }
})

// --- Update glow positions on scroll/resize ---

function updateGlowPositions() {
  if (!frameRef.value || !editMode.value) return

  if (selectedElement.value) {
    const el = frameRef.value.querySelector(`[data-op-id="${selectedElement.value.id}"]`) as HTMLElement | null
    if (el) {
      selectGlow.value = getGlowRect(el)
    } else {
      selectGlow.value = null
    }
  }
}

// --- Lifecycle ---

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', updateGlowPositions)

  if (frameRef.value) {
    resizeObserver = new ResizeObserver(updateGlowPositions)
    resizeObserver.observe(frameRef.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', updateGlowPositions)
  resizeObserver?.disconnect()
})

// Clear glows when leaving edit mode
watch(editMode, (isEditing) => {
  if (!isEditing) {
    hoverGlow.value = null
    selectGlow.value = null
  }
})
</script>

<template>
  <div
    ref="frameRef"
    class="op-edit-frame"
    :class="{ 'op-edit-frame--active': editMode }"
    :data-op-edit-mode="editMode ? 'edit' : 'preview'"
    @mousemove="handleMouseMove"
    @click="handleClick"
    @mouseleave="handleMouseLeave"
  >
    <!-- Content slot -->
    <slot />

    <!-- Glow overlays (only in edit mode) -->
    <template v-if="editMode">
      <!-- Hover glow: subtle blue outline -->
      <div
        v-if="hoverGlowStyle"
        class="op-glow op-glow--hover"
        :style="hoverGlowStyle"
        data-op-glow="hover"
      />

      <!-- Selection glow: bright luminous outline -->
      <div
        v-if="selectGlowStyle"
        class="op-glow op-glow--select"
        :style="selectGlowStyle"
        data-op-glow="select"
      />
    </template>

    <!-- Floating block toolbar (only in edit mode) -->
    <OpBlockToolbar
      v-if="editMode"
      :container-el="frameRef"
      @move-up="$emit('block-move-up')"
      @move-down="$emit('block-move-down')"
      @delete="$emit('block-delete')"
    />

    <!-- Edit mode toggle button -->
    <button
      class="op-edit-frame__toggle"
      :class="{ 'op-edit-frame__toggle--active': editMode }"
      type="button"
      :aria-label="editMode ? 'Switch to preview mode' : 'Switch to edit mode'"
      :aria-pressed="editMode"
      @click.stop="toggleEditMode"
    >
      <svg
        v-if="!editMode"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  </div>
</template>

<style>
/* ===== OpEditFrame Base ===== */
.op-edit-frame {
  position: relative;
  min-height: 100%;
}

/* ===== Glow Overlays ===== */
.op-glow {
  position: absolute;
  border-radius: 2px;
  pointer-events: none;
  z-index: 9998;
  transition: all 0.15s ease-out;
}

/* Hover: subtle 1px blue outline */
.op-glow--hover {
  border: 1px solid rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 4px rgba(59, 130, 246, 0.15);
}

/* Select: bright 2px luminous border */
.op-glow--select {
  border: 2px solid rgba(59, 130, 246, 0.9);
  box-shadow:
    0 0 6px rgba(59, 130, 246, 0.3),
    0 0 12px rgba(59, 130, 246, 0.1);
}

/* ===== Toggle Button ===== */
.op-edit-frame__toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(59, 130, 246, 0.3);
  background: rgba(255, 255, 255, 0.95);
  color: #64748b;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.op-edit-frame__toggle:hover {
  border-color: rgba(59, 130, 246, 0.6);
  color: #3b82f6;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.2);
}

.op-edit-frame__toggle--active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
  box-shadow:
    0 2px 8px rgba(59, 130, 246, 0.3),
    0 0 12px rgba(59, 130, 246, 0.15);
}

.op-edit-frame__toggle--active:hover {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

/* ===== Dark Mode ===== */
@media (prefers-color-scheme: dark) {
  .op-edit-frame__toggle {
    background: rgba(30, 41, 59, 0.95);
    color: #94a3b8;
    border-color: rgba(59, 130, 246, 0.3);
  }

  .op-edit-frame__toggle:hover {
    color: #60a5fa;
    border-color: rgba(59, 130, 246, 0.6);
  }

  .op-edit-frame__toggle--active {
    background: #3b82f6;
    color: white;
  }
}
</style>
