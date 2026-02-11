<script setup lang="ts">
/**
 * OpEditFrame — The Glow Frame + In-Context Overlay Engine
 *
 * Editor overlay that wraps content and provides In-Context Editing functionality.
 * In preview mode, renders content without decoration.
 * In edit mode:
 *   - Attaches event listeners for hover/select interactions
 *   - Renders a luminous 1-2px border overlay (the "Glow") around hovered/selected elements
 *   - Shows a floating overlay panel (top-right, draggable, collapsible) with Liquid Glass effect
 *   - Displays selected component metadata (type, id, slot)
 *   - Provides Save/Discard toolbar with keyboard shortcuts (Ctrl+S, Escape)
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useOpenPress } from '../composables/useOpenPress'
import { useEditor } from '../composables/useEditor'
import { useTiptapBridge } from '../composables/useTiptapBridge'
import { useBlockToolbar } from '../composables/useBlockToolbar'
import { useContentSync } from '../composables/useContentSync'
import { findOpElement } from '../utils/find-op-element'
import type { OpElementType } from '../utils/find-op-element'

const { editMode } = useOpenPress()
const {
  isDirty,
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
const { isSaving, lastError, flush } = useContentSync()

const emit = defineEmits<{
  (e: 'block-move-up'): void
  (e: 'block-move-down'): void
  (e: 'block-delete'): void
  (e: 'save'): void
  (e: 'discard'): void
}>()

const frameRef = ref<HTMLElement | null>(null)

// --- Overlay panel state ---

const panelCollapsed = ref(false)
const panelPosition = ref({ x: 0, y: 16 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

function initPanelPosition() {
  // Position top-right with 16px margin
  panelPosition.value = {
    x: window.innerWidth - 320 - 16,
    y: 16,
  }
}

function togglePanel() {
  panelCollapsed.value = !panelCollapsed.value
}

function startDrag(e: MouseEvent) {
  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - panelPosition.value.x,
    y: e.clientY - panelPosition.value.y,
  }
  e.preventDefault()
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return
  const newX = e.clientX - dragOffset.value.x
  const newY = e.clientY - dragOffset.value.y
  // Clamp to viewport
  panelPosition.value = {
    x: Math.max(0, Math.min(newX, window.innerWidth - 200)),
    y: Math.max(0, Math.min(newY, window.innerHeight - 48)),
  }
}

function stopDrag() {
  isDragging.value = false
}

const panelStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${panelPosition.value.y}px`,
  left: `${panelPosition.value.x}px`,
  zIndex: 10000,
}))

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

// --- Selected element metadata ---

interface ElementMeta {
  id: string
  type: OpElementType
  blockType: string | null
  slotName: string | null
  sectionType: string | null
}

function getElementMeta(el: HTMLElement): ElementMeta {
  return {
    id: el.getAttribute('data-op-id') ?? '',
    type: (el.getAttribute('data-op-block') ? 'block'
      : el.getAttribute('data-op-slot') ? 'slot'
        : 'section') as OpElementType,
    blockType: el.getAttribute('data-op-block'),
    slotName: el.getAttribute('data-op-slot'),
    sectionType: el.getAttribute('data-op-section'),
  }
}

const selectedMeta = ref<ElementMeta | null>(null)
const hoveredMeta = ref<ElementMeta | null>(null)

const displayMeta = computed(() => selectedMeta.value ?? hoveredMeta.value)

function formatElementLabel(meta: ElementMeta): string {
  if (meta.blockType) return `Block: ${meta.blockType}`
  if (meta.slotName) return `Slot: ${meta.slotName}`
  if (meta.sectionType) return `Section: ${meta.sectionType}`
  return `Element: ${meta.type}`
}

// --- Event handlers ---

function handleMouseMove(e: MouseEvent) {
  if (!editMode.value) return

  const found = findOpElement(e.target, frameRef.value)
  if (found) {
    hoverElement(found.id, found.type)
    hoverGlow.value = getGlowRect(found.el)
    hoveredMeta.value = getElementMeta(found.el)
  } else {
    clearHover()
    hoverGlow.value = null
    hoveredMeta.value = null
  }
}

function handleClick(e: MouseEvent) {
  if (!editMode.value) return

  // Don't intercept clicks on the overlay panel
  const target = e.target as HTMLElement | null
  if (target?.closest('[data-op-overlay-panel]')) return

  // Don't intercept clicks when a Tiptap inline editor is active —
  // let the editor handle its own focus/selection events
  if (inlineEditing.value) {
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
    selectedMeta.value = getElementMeta(found.el)
    showToolbar({ elementId: found.id, elementType: found.type, element: found.el })
  } else {
    clearSelection()
    selectGlow.value = null
    selectedMeta.value = null
    hideToolbar()
  }
}

function handleMouseLeave() {
  if (!editMode.value) return
  clearHover()
  hoverGlow.value = null
  hoveredMeta.value = null
}

// --- Save / Discard ---

async function handleSave() {
  if (!isDirty.value || isSaving.value) return
  const success = await flush()
  if (success) {
    emit('save')
  }
}

async function handleDiscard() {
  if (isSaving.value) return
  try {
    const status = await $fetch('/api/_openpress/git/status')
    if (status && typeof status === 'object' && 'files' in status) {
      const files = (status as { files: Array<{ path: string }> }).files
      if (files.length > 0) {
        await $fetch('/api/_openpress/git/undo', {
          method: 'POST',
          body: { hash: 'HEAD', slug: undefined },
        })
      }
    }
    isDirty.value = false
    emit('discard')
  } catch {
    // Discard failed — user can still manually handle
  }
}

// --- Keyboard shortcuts ---

function handleKeyDown(e: KeyboardEvent) {
  if (!editMode.value) return

  // Ctrl+S / Cmd+S — Save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
    return
  }

  if (e.key === 'Escape') {
    // If inline editing is active, deactivate it first (don't clear selection)
    if (inlineEditing.value) {
      deactivateBlock()
      setInlineEditing(false)
      return
    }
    // If a component is selected, clear the selection
    if (selectedElement.value) {
      clearSelection()
      selectGlow.value = null
      selectedMeta.value = null
      hideToolbar()
      return
    }
    // Otherwise close the editor
    toggleEditMode()
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
    selectedMeta.value = null
    hoveredMeta.value = null
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
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  initPanelPosition()

  if (frameRef.value) {
    resizeObserver = new ResizeObserver(updateGlowPositions)
    resizeObserver.observe(frameRef.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', updateGlowPositions)
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  resizeObserver?.disconnect()
})

// Clear glows when leaving edit mode
watch(editMode, (isEditing) => {
  if (!isEditing) {
    hoverGlow.value = null
    selectGlow.value = null
    selectedMeta.value = null
    hoveredMeta.value = null
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

    <!-- ===== Floating Overlay Panel ===== -->
    <Teleport to="body">
      <div
        v-if="editMode"
        class="op-overlay-panel"
        :class="{
          'op-overlay-panel--collapsed': panelCollapsed,
          'op-overlay-panel--dragging': isDragging,
        }"
        :style="panelStyle"
        data-op-overlay-panel
        role="toolbar"
        aria-label="Editor overlay panel"
        @click.stop
        @mousedown.stop
      >
        <!-- Draggable title bar -->
        <div
          class="op-overlay-panel__titlebar"
          @mousedown="startDrag"
        >
          <span class="op-overlay-panel__title">OpenPress Editor</span>
          <div class="op-overlay-panel__titlebar-actions">
            <button
              class="op-overlay-panel__titlebar-btn"
              type="button"
              :aria-label="panelCollapsed ? 'Expand panel' : 'Collapse panel'"
              @click.stop="togglePanel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path v-if="panelCollapsed" d="m6 9 6 6 6-6" />
                <path v-else d="m18 15-6-6-6 6" />
              </svg>
            </button>
            <button
              class="op-overlay-panel__titlebar-btn op-overlay-panel__titlebar-btn--close"
              type="button"
              aria-label="Close editor"
              @click.stop="toggleEditMode"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Panel body (hidden when collapsed) -->
        <div v-if="!panelCollapsed" class="op-overlay-panel__body">
          <!-- Component selection info -->
          <div class="op-overlay-panel__section">
            <div class="op-overlay-panel__section-label">Selection</div>
            <div v-if="displayMeta" class="op-overlay-panel__meta">
              <span class="op-overlay-panel__meta-badge">
                {{ displayMeta.type }}
              </span>
              <span class="op-overlay-panel__meta-name">
                {{ formatElementLabel(displayMeta) }}
              </span>
              <span class="op-overlay-panel__meta-id" :title="displayMeta.id">
                {{ displayMeta.id.slice(0, 8) }}...
              </span>
            </div>
            <div v-else class="op-overlay-panel__meta-empty">
              Hover or click an element to inspect
            </div>
          </div>

          <!-- Toolbar actions -->
          <div class="op-overlay-panel__section">
            <div class="op-overlay-panel__section-label">Actions</div>
            <div class="op-overlay-panel__toolbar">
              <button
                class="op-overlay-panel__btn op-overlay-panel__btn--save"
                type="button"
                :disabled="!isDirty || isSaving"
                title="Save changes (Ctrl+S)"
                @click.stop="handleSave"
              >
                <svg
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
                  <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                  <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
                  <path d="M7 3v4a1 1 0 0 0 1 1h7" />
                </svg>
                {{ isSaving ? 'Saving...' : 'Save' }}
              </button>
              <button
                class="op-overlay-panel__btn op-overlay-panel__btn--discard"
                type="button"
                :disabled="!isDirty || isSaving"
                title="Discard changes"
                @click.stop="handleDiscard"
              >
                <svg
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
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Discard
              </button>
            </div>
          </div>

          <!-- Status bar -->
          <div class="op-overlay-panel__status">
            <span
              class="op-overlay-panel__status-dot"
              :class="{
                'op-overlay-panel__status-dot--dirty': isDirty,
                'op-overlay-panel__status-dot--saving': isSaving,
                'op-overlay-panel__status-dot--clean': !isDirty && !isSaving,
              }"
            />
            <span v-if="isSaving" class="op-overlay-panel__status-text">Saving...</span>
            <span v-else-if="isDirty" class="op-overlay-panel__status-text">Unsaved changes</span>
            <span v-else class="op-overlay-panel__status-text">All changes saved</span>
            <span v-if="lastError" class="op-overlay-panel__status-error" :title="lastError">!</span>
          </div>

          <!-- Keyboard shortcuts hint -->
          <div class="op-overlay-panel__shortcuts">
            <kbd>Ctrl+S</kbd> Save
            <kbd>Esc</kbd> Deselect / Close
          </div>
        </div>
      </div>
    </Teleport>

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

/* ===== Floating Overlay Panel (Liquid Glass) ===== */
.op-overlay-panel {
  width: 288px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  overflow: hidden;
  transition: width 0.2s ease, box-shadow 0.2s ease;
  user-select: none;
}

.op-overlay-panel--dragging {
  opacity: 0.9;
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.op-overlay-panel--collapsed {
  width: 200px;
}

/* Title bar */
.op-overlay-panel__titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: grab;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.op-overlay-panel--dragging .op-overlay-panel__titlebar {
  cursor: grabbing;
}

.op-overlay-panel__title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #94a3b8;
}

.op-overlay-panel__titlebar-actions {
  display: flex;
  gap: 4px;
}

.op-overlay-panel__titlebar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.op-overlay-panel__titlebar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.op-overlay-panel__titlebar-btn--close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* Panel body */
.op-overlay-panel__body {
  padding: 0;
}

/* Sections */
.op-overlay-panel__section {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.op-overlay-panel__section-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  margin-bottom: 6px;
}

/* Meta display */
.op-overlay-panel__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.op-overlay-panel__meta-badge {
  display: inline-flex;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-radius: 3px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.op-overlay-panel__meta-name {
  font-size: 12px;
  font-weight: 500;
  color: #e2e8f0;
}

.op-overlay-panel__meta-id {
  font-size: 10px;
  font-family: 'SF Mono', Menlo, monospace;
  color: #475569;
}

.op-overlay-panel__meta-empty {
  font-size: 12px;
  color: #475569;
  font-style: italic;
}

/* Toolbar buttons */
.op-overlay-panel__toolbar {
  display: flex;
  gap: 6px;
}

.op-overlay-panel__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: rgba(255, 255, 255, 0.06);
  color: #cbd5e1;
}

.op-overlay-panel__btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

.op-overlay-panel__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.op-overlay-panel__btn--save:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.op-overlay-panel__btn--discard:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

/* Status bar */
.op-overlay-panel__status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.op-overlay-panel__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.op-overlay-panel__status-dot--clean {
  background: #22c55e;
  box-shadow: 0 0 4px rgba(34, 197, 94, 0.4);
}

.op-overlay-panel__status-dot--dirty {
  background: #f59e0b;
  box-shadow: 0 0 4px rgba(245, 158, 11, 0.4);
}

.op-overlay-panel__status-dot--saving {
  background: #3b82f6;
  box-shadow: 0 0 4px rgba(59, 130, 246, 0.4);
  animation: op-pulse 1s ease-in-out infinite;
}

@keyframes op-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.op-overlay-panel__status-text {
  font-size: 11px;
  color: #94a3b8;
}

.op-overlay-panel__status-error {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  margin-left: auto;
  cursor: help;
}

/* Shortcuts hint */
.op-overlay-panel__shortcuts {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 10px;
  color: #475569;
}

.op-overlay-panel__shortcuts kbd {
  display: inline-flex;
  padding: 1px 4px;
  font-size: 10px;
  font-family: 'SF Mono', Menlo, monospace;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.05);
  color: #64748b;
}

/* ===== Mobile: hide overlay panel ===== */
@media (max-width: 768px) {
  .op-overlay-panel {
    display: none;
  }
}

/* ===== Dark Mode (toggle button only — panel is already dark) ===== */
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
