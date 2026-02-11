<script setup lang="ts">
/**
 * OpTreeNode — Recursive tree node for the Site Map.
 *
 * Renders a single node with:
 * - Expand/collapse toggle for nodes with children
 * - Click to open page in editor
 * - Inline rename form
 * - Delete button
 * - Recursive rendering of children
 */
import { computed } from 'vue'
import type { PageTreeNode } from '../composables/usePageTree'

const props = defineProps<{
  node: PageTreeNode
  depth: number
  renamingSlug: string | null
  confirmDeleteSlug: string | null
  renameTitle: string
  renameSlug: string
}>()

const emit = defineEmits<{
  toggle: [slug: string]
  open: [slug: string]
  'start-rename': [node: PageTreeNode]
  'cancel-rename': []
  'submit-rename': [oldSlug: string]
  'update:rename-title': [value: string]
  'update:rename-slug': [value: string]
  'request-delete': [slug: string]
  'cancel-delete': []
  'confirm-delete': []
}>()

const isRenaming = computed(() => props.renamingSlug === props.node.slug)
const hasChildren = computed(() => props.node.children.length > 0)
const indentPx = computed(() => `${props.depth * 20}px`)
</script>

<template>
  <div class="op-tree-node">
    <div
      class="op-tree-node__row"
      :style="{ paddingLeft: indentPx }"
    >
      <!-- Expand/Collapse Toggle -->
      <button
        v-if="hasChildren"
        class="op-tree-node__toggle"
        :aria-expanded="node.expanded"
        :aria-label="node.expanded ? 'Collapse' : 'Expand'"
        @click="emit('toggle', node.slug)"
      >
        <span
          class="op-tree-node__arrow"
          :class="{ 'op-tree-node__arrow--open': node.expanded }"
          v-text="'\u25B6'"
        />
      </button>
      <span v-else class="op-tree-node__toggle-spacer" />

      <!-- Icon -->
      <span v-if="node.isPage" class="op-tree-node__icon" v-text="'\u{1F4C4}'" />
      <span v-else class="op-tree-node__icon" v-text="'\u{1F4C1}'" />

      <!-- Rename Form -->
      <template v-if="isRenaming">
        <div class="op-tree-node__rename-form">
          <input
            class="op-tree-node__rename-input"
            type="text"
            placeholder="Title"
            :value="renameTitle"
            @input="emit('update:rename-title', ($event.target as HTMLInputElement).value)"
            @keydown.enter="emit('submit-rename', node.slug)"
            @keydown.escape="emit('cancel-rename')"
          />
          <input
            class="op-tree-node__rename-input op-tree-node__rename-input--slug"
            type="text"
            placeholder="slug"
            :value="renameSlug"
            @input="emit('update:rename-slug', ($event.target as HTMLInputElement).value)"
            @keydown.enter="emit('submit-rename', node.slug)"
            @keydown.escape="emit('cancel-rename')"
          />
          <button class="op-tree-node__action" @click="emit('submit-rename', node.slug)" v-text="'\u2713'" />
          <button class="op-tree-node__action" @click="emit('cancel-rename')" v-text="'\u2717'" />
        </div>
      </template>

      <!-- Normal Display -->
      <template v-else>
        <button
          v-if="node.isPage"
          class="op-tree-node__label op-tree-node__label--page"
          @click="emit('open', node.slug)"
        >
          {{ node.title ?? node.segment }}
        </button>
        <span v-else class="op-tree-node__label op-tree-node__label--folder">
          {{ node.segment }}
        </span>

        <span class="op-tree-node__slug">/{{ node.slug }}</span>

        <!-- Actions -->
        <div v-if="node.isPage" class="op-tree-node__actions">
          <button
            class="op-tree-node__action"
            title="Rename"
            @click="emit('start-rename', node)"
            v-text="'\u270E'"
          />
          <button
            class="op-tree-node__action op-tree-node__action--danger"
            title="Delete"
            @click="emit('request-delete', node.slug)"
            v-text="'\u{1F5D1}'"
          />
        </div>
      </template>
    </div>

    <!-- Children (recursive) -->
    <template v-if="hasChildren && node.expanded">
      <div
        v-for="child in node.children"
        :key="child.slug"
        role="group"
      >
        <op-tree-node
          :node="child"
          :depth="depth + 1"
          :renaming-slug="renamingSlug"
          :confirm-delete-slug="confirmDeleteSlug"
          :rename-title="renameTitle"
          :rename-slug="renameSlug"
          @toggle="emit('toggle', $event)"
          @open="emit('open', $event)"
          @start-rename="emit('start-rename', $event)"
          @cancel-rename="emit('cancel-rename')"
          @submit-rename="emit('submit-rename', $event)"
          @update:rename-title="emit('update:rename-title', $event)"
          @update:rename-slug="emit('update:rename-slug', $event)"
          @request-delete="emit('request-delete', $event)"
          @cancel-delete="emit('cancel-delete')"
          @confirm-delete="emit('confirm-delete')"
        />
      </div>
    </template>
  </div>
</template>

<style>
.op-tree-node__row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.5rem;
  border-radius: 6px;
  transition: background 0.1s;
}

.op-tree-node__row:hover {
  background: #f1f5f9;
}

.op-tree-node__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.op-tree-node__toggle-spacer {
  display: inline-block;
  width: 20px;
  flex-shrink: 0;
}

.op-tree-node__arrow {
  display: inline-block;
  font-size: 0.6rem;
  transition: transform 0.15s;
  color: #6b7280;
}

.op-tree-node__arrow--open {
  transform: rotate(90deg);
}

.op-tree-node__icon {
  font-size: 0.9rem;
  flex-shrink: 0;
  margin-right: 0.25rem;
}

.op-tree-node__label {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.op-tree-node__label--page {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-weight: 500;
  color: #1e40af;
  text-decoration: none;
}

.op-tree-node__label--page:hover {
  text-decoration: underline;
}

.op-tree-node__label--folder {
  font-weight: 500;
  color: #374151;
}

.op-tree-node__slug {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-left: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.op-tree-node__actions {
  display: none;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
  flex-shrink: 0;
}

.op-tree-node__row:hover .op-tree-node__actions {
  display: flex;
}

.op-tree-node__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #6b7280;
  transition: background 0.1s, color 0.1s;
}

.op-tree-node__action:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.op-tree-node__action--danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

.op-tree-node__rename-form {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex: 1;
}

.op-tree-node__rename-input {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.8rem;
  outline: none;
  width: 140px;
}

.op-tree-node__rename-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.op-tree-node__rename-input--slug {
  width: 120px;
  color: #6b7280;
}
</style>
