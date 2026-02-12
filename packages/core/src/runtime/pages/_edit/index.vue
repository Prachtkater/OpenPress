<script setup lang="ts">
/**
 * OpenPress Pages Overview — /_edit
 *
 * Full-page view of all pages in the site.
 * Two view modes: List (tree) and Mindmap (radial SVG).
 * Provides CRUD actions: create, rename, delete.
 * Navigating to a specific page opens the page editor (/_edit/:slug).
 */
import { ref, onMounted } from 'vue'
import { usePageTree, type PageTreeNode } from '../../composables/usePageTree'

const {
  isLoading,
  error,
  tree,
  renamingSlug,
  showNewPageForm,
  loadPages,
  createPage,
  deletePage,
  renamePage,
  toggleNode,
  openPage,
} = usePageTree()

// --- View Mode ---
type ViewMode = 'list' | 'mindmap'
const viewMode = ref<ViewMode>('list')

// --- New Page Form ---
const newPageTitle = ref('')
const newPageSlug = ref('')
const newPageParentSlug = ref<string | null>(null)

function openNewPageForm(parentSlug?: string) {
  newPageTitle.value = ''
  newPageSlug.value = ''
  newPageParentSlug.value = parentSlug ?? null
  showNewPageForm.value = true
}

function cancelNewPage() {
  showNewPageForm.value = false
  newPageTitle.value = ''
  newPageSlug.value = ''
  newPageParentSlug.value = null
}

async function submitNewPage() {
  const slug = newPageSlug.value.trim()
  const title = newPageTitle.value.trim()
  if (!slug || !title) return

  const fullSlug = newPageParentSlug.value
    ? `${newPageParentSlug.value}/${slug}`
    : slug

  const success = await createPage(fullSlug, title)
  if (success) {
    cancelNewPage()
  }
}

/** Handler for mindmap add-page button on links */
function handleMindmapAddPage(parentSlug: string) {
  openNewPageForm(parentSlug)
}

// --- Rename ---
const renameTitle = ref('')
const renameSlug = ref('')

function startRename(node: PageTreeNode) {
  renamingSlug.value = node.slug
  renameTitle.value = node.title ?? ''
  renameSlug.value = node.slug
}

function cancelRename() {
  renamingSlug.value = null
  renameTitle.value = ''
  renameSlug.value = ''
}

async function submitRename(oldSlug: string) {
  const title = renameTitle.value.trim()
  const slug = renameSlug.value.trim()
  if (!title) return

  const newSlug = slug !== oldSlug ? slug : undefined
  const success = await renamePage(oldSlug, title, newSlug)
  if (success) {
    cancelRename()
  }
}

// --- Delete ---
const confirmDeleteSlug = ref<string | null>(null)

function requestDelete(slug: string) {
  confirmDeleteSlug.value = slug
}

function cancelDelete() {
  confirmDeleteSlug.value = null
}

async function confirmDelete() {
  if (!confirmDeleteSlug.value) return
  await deletePage(confirmDeleteSlug.value)
  confirmDeleteSlug.value = null
}

// --- Init ---
onMounted(() => {
  loadPages()
})
</script>

<template>
  <div class="op-pages">
    <!-- Header -->
    <header class="op-pages__header">
      <h1 class="op-pages__title">Pages</h1>
      <div class="op-pages__header-actions">
        <!-- View Toggle -->
        <div class="op-pages__toggle" role="radiogroup" aria-label="View mode">
          <button
            class="op-pages__toggle-btn"
            :class="{ 'op-pages__toggle-btn--active': viewMode === 'list' }"
            role="radio"
            :aria-checked="viewMode === 'list'"
            @click="viewMode = 'list'"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="1" y="2" width="14" height="2" rx="1" fill="currentColor" />
              <rect x="1" y="7" width="14" height="2" rx="1" fill="currentColor" />
              <rect x="1" y="12" width="14" height="2" rx="1" fill="currentColor" />
            </svg>
            List
          </button>
          <button
            class="op-pages__toggle-btn"
            :class="{ 'op-pages__toggle-btn--active': viewMode === 'mindmap' }"
            role="radio"
            :aria-checked="viewMode === 'mindmap'"
            @click="viewMode = 'mindmap'"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="3" fill="currentColor" />
              <circle cx="3" cy="3" r="1.5" fill="currentColor" />
              <circle cx="13" cy="3" r="1.5" fill="currentColor" />
              <circle cx="3" cy="13" r="1.5" fill="currentColor" />
              <circle cx="13" cy="13" r="1.5" fill="currentColor" />
              <line x1="6" y1="6" x2="4" y2="4" stroke="currentColor" stroke-width="1" />
              <line x1="10" y1="6" x2="12" y2="4" stroke="currentColor" stroke-width="1" />
              <line x1="6" y1="10" x2="4" y2="12" stroke="currentColor" stroke-width="1" />
              <line x1="10" y1="10" x2="12" y2="12" stroke="currentColor" stroke-width="1" />
            </svg>
            Mindmap
          </button>
        </div>
        <button
          class="op-pages__btn op-pages__btn--primary"
          @click="openNewPageForm()"
        >
          + New Page
        </button>
      </div>
    </header>

    <!-- Error Banner -->
    <div v-if="error" class="op-pages__error" role="alert">
      {{ error }}
      <button class="op-pages__error-dismiss" @click="error = null">
        Dismiss
      </button>
    </div>

    <!-- New Page Form -->
    <div v-if="showNewPageForm" class="op-pages__form">
      <h2 class="op-pages__form-title">
        {{ newPageParentSlug ? `New sub-page under /${newPageParentSlug}` : 'Create New Page' }}
      </h2>
      <div class="op-pages__form-fields">
        <label class="op-pages__label">
          Title
          <input
            v-model="newPageTitle"
            class="op-pages__input"
            type="text"
            placeholder="My New Page"
            @keydown.enter="submitNewPage"
          />
        </label>
        <label class="op-pages__label">
          Slug
          <input
            v-model="newPageSlug"
            class="op-pages__input"
            type="text"
            placeholder="my-new-page"
            @keydown.enter="submitNewPage"
          />
        </label>
      </div>
      <div class="op-pages__form-actions">
        <button
          class="op-pages__btn op-pages__btn--primary"
          :disabled="!newPageTitle.trim() || !newPageSlug.trim()"
          @click="submitNewPage"
        >
          Create
        </button>
        <button class="op-pages__btn" @click="cancelNewPage">
          Cancel
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="op-pages__loading">
      Loading pages...
    </div>

    <!-- Empty State -->
    <div v-else-if="tree.length === 0 && !showNewPageForm" class="op-pages__empty">
      <p>No pages yet.</p>
      <button class="op-pages__btn op-pages__btn--primary" @click="openNewPageForm()">
        Create your first page
      </button>
    </div>

    <!-- List View -->
    <ul v-else-if="viewMode === 'list'" class="op-pages__tree" role="tree">
      <li
        v-for="node in tree"
        :key="node.slug"
        class="op-pages__tree-root"
        role="treeitem"
      >
        <op-tree-node
          :node="node"
          :depth="0"
          :renaming-slug="renamingSlug"
          :confirm-delete-slug="confirmDeleteSlug"
          :rename-title="renameTitle"
          :rename-slug="renameSlug"
          @toggle="toggleNode"
          @open="openPage"
          @start-rename="startRename"
          @cancel-rename="cancelRename"
          @submit-rename="submitRename"
          @update:rename-title="renameTitle = $event"
          @update:rename-slug="renameSlug = $event"
          @request-delete="requestDelete"
          @cancel-delete="cancelDelete"
          @confirm-delete="confirmDelete"
        />
      </li>
    </ul>

    <!-- Mindmap View -->
    <OpMindmap
      v-else
      :tree="tree"
      @open-page="openPage"
      @add-page="handleMindmapAddPage"
    />

    <!-- Delete Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="confirmDeleteSlug"
        class="op-pages__overlay"
        @click.self="cancelDelete"
      >
        <div class="op-pages__dialog" role="alertdialog">
          <h3>Delete Page</h3>
          <p>
            Are you sure you want to delete
            <strong>{{ confirmDeleteSlug }}</strong>?
            This action cannot be undone.
          </p>
          <div class="op-pages__dialog-actions">
            <button
              class="op-pages__btn op-pages__btn--danger"
              @click="confirmDelete"
            >
              Delete
            </button>
            <button class="op-pages__btn" @click="cancelDelete">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
.op-pages {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
  color: #1a1a2e;
}

.op-pages__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.op-pages__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.op-pages__header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* View Toggle */
.op-pages__toggle {
  display: inline-flex;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}

.op-pages__toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border: none;
  background: #fff;
  font-size: 0.8rem;
  cursor: pointer;
  color: #6b7280;
  transition: background 0.15s, color 0.15s;
}

.op-pages__toggle-btn:not(:last-child) {
  border-right: 1px solid #d1d5db;
}

.op-pages__toggle-btn--active {
  background: #2563eb;
  color: #fff;
}

.op-pages__toggle-btn:hover:not(.op-pages__toggle-btn--active) {
  background: #f3f4f6;
}

/* Buttons */
.op-pages__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.op-pages__btn:hover {
  background: #f3f4f6;
}

.op-pages__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.op-pages__btn--primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.op-pages__btn--primary:hover {
  background: #1d4ed8;
}

.op-pages__btn--danger {
  background: #dc2626;
  color: #fff;
  border-color: #dc2626;
}

.op-pages__btn--danger:hover {
  background: #b91c1c;
}

/* Error banner */
.op-pages__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  font-size: 0.875rem;
}

.op-pages__error-dismiss {
  background: none;
  border: none;
  color: #991b1b;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.8rem;
}

/* New Page Form */
.op-pages__form {
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.op-pages__form-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
}

.op-pages__form-fields {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.op-pages__label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 500;
  flex: 1;
}

.op-pages__input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
}

.op-pages__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.op-pages__form-actions {
  display: flex;
  gap: 0.5rem;
}

/* States */
.op-pages__loading {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
}

.op-pages__empty {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.op-pages__empty p {
  margin-bottom: 1rem;
  font-size: 1rem;
}

/* List tree */
.op-pages__tree {
  list-style: none;
  padding: 0;
  margin: 0;
}

.op-pages__tree-root {
  list-style: none;
}

/* Delete confirmation overlay */
.op-pages__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.op-pages__dialog {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.op-pages__dialog h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.op-pages__dialog p {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: #4b5563;
}

.op-pages__dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 640px) {
  .op-pages {
    padding: 1rem;
  }

  .op-pages__header {
    flex-direction: column;
    align-items: stretch;
  }

  .op-pages__header-actions {
    justify-content: space-between;
  }

  .op-pages__form-fields {
    flex-direction: column;
  }
}
</style>
