<script setup lang="ts">
/**
 * OpInlineEdit — Tiptap Inline Rich-Text Editor
 *
 * Renders an inline-editable Tiptap editor for a content block.
 * In view mode (or when not the active block), renders content as static HTML.
 * In edit mode, when the block is double-clicked, activates the Tiptap editor
 * for in-place editing. Changes are emitted back via the TiptapBridge.
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useEditor as useTiptapEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import type { JSONContent } from '@tiptap/core'
import { useOpenPress } from '../composables/useOpenPress'
import { useEditor } from '../composables/useEditor'
import { useTiptapBridge } from '../composables/useTiptapBridge'

const props = defineProps<{
  /** The block ID this editor instance belongs to */
  blockId: string
  /** The section ID containing this block */
  sectionId: string
  /** The slot name containing this block */
  slotName: string
  /** Initial content — JSONContent object or HTML string */
  content?: JSONContent | string
}>()

const emit = defineEmits<{
  /** Emitted when the Tiptap content changes */
  (e: 'update', payload: { content: JSONContent; html: string }): void
}>()

const { editMode } = useOpenPress()
const { selectedElement, selectElement, setInlineEditing, inlineEditing } = useEditor()
const {
  activateBlock,
  deactivateBlock,
  isBlockActive,
  emitContentUpdate,
} = useTiptapBridge()

const editorWrapperRef = ref<HTMLElement | null>(null)

const isActive = computed(() => isBlockActive(props.blockId))

// Determine initial content
const initialContent = computed(() => {
  if (props.content && typeof props.content === 'object') {
    return props.content as JSONContent
  }
  return undefined
})

const initialHtml = computed(() => {
  if (typeof props.content === 'string') {
    return props.content
  }
  return undefined
})

// Create the Tiptap editor instance
const tiptapEditor = useTiptapEditor({
  extensions: [StarterKit],
  content: initialContent.value ?? initialHtml.value ?? '',
  editable: false,
  onUpdate: ({ editor }) => {
    if (!isActive.value) return

    emit('update', {
      content: editor.getJSON(),
      html: editor.getHTML(),
    })

    emitContentUpdate(editor)
  },
})

// Watch edit mode and active state to toggle editor editability
watch([editMode, isActive], ([editing, active]) => {
  if (tiptapEditor.value) {
    tiptapEditor.value.setEditable(editing && active)
  }
})

// Double-click to activate inline editing
function handleDoubleClick() {
  if (!editMode.value) return
  if (isActive.value) return

  selectElement(props.blockId, 'block')
  activateBlock(props.blockId, props.sectionId, props.slotName)
  setInlineEditing(true)

  // Focus the editor after activation
  setTimeout(() => {
    tiptapEditor.value?.chain().focus().run()
  }, 0)
}

// Deactivate on blur (when clicking outside the editor)
function handleBlur() {
  if (!isActive.value) return

  deactivateBlock()
  setInlineEditing(false)

  if (tiptapEditor.value) {
    tiptapEditor.value.setEditable(false)
  }
}

// Clean up on unmount
onBeforeUnmount(() => {
  if (isActive.value) {
    deactivateBlock()
    setInlineEditing(false)
  }
})
</script>

<template>
  <div
    ref="editorWrapperRef"
    class="op-inline-edit"
    :class="{
      'op-inline-edit--active': isActive,
      'op-inline-edit--editable': editMode,
    }"
    :data-op-inline-edit="blockId"
    @dblclick.stop="handleDoubleClick"
  >
    <EditorContent
      v-if="tiptapEditor"
      :editor="tiptapEditor"
      class="op-inline-edit__content"
      @blur="handleBlur"
    />
  </div>
</template>

<style>
/* ===== OpInlineEdit Base ===== */
.op-inline-edit {
  position: relative;
  min-height: 1em;
}

/* Editable cursor hint (edit mode, not yet active) */
.op-inline-edit--editable:not(.op-inline-edit--active) {
  cursor: text;
}

/* Active editor styling: subtle inner border for focus */
.op-inline-edit--active {
  outline: 2px solid rgba(59, 130, 246, 0.4);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Tiptap ProseMirror overrides */
.op-inline-edit .tiptap {
  outline: none;
  min-height: 1em;
}

.op-inline-edit .tiptap p.is-editor-empty:first-child::before {
  color: #9ca3af;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
