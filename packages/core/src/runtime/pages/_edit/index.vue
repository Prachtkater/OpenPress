<script setup lang="ts">
/**
 * OpenPress Site Map — /_edit
 *
 * Full-page tree view of all pages in the site.
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

// --- New Page Form ---
const newPageTitle = ref('')
const newPageSlug = ref('')

function openNewPageForm() {
  newPageTitle.value = ''
  newPageSlug.value = ''
  showNewPageForm.value = true
}

function cancelNewPage() {
  showNewPageForm.value = false
  newPageTitle.value = ''
  newPageSlug.value = ''
}

async function submitNewPage() {
  const slug = newPageSlug.value.trim()
  const title = newPageTitle.value.trim()
  if (!slug || !title) return

  const success = await createPage(slug, title)
  if (success) {
    cancelNewPage()
  }
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
  <div class="op-sitemap">
    <!-- Header -->
    <header class="op-sitemap__header">
      <h1 class="op-sitemap__title">Site Map</h1>
      <button
        class="op-sitemap__btn op-sitemap__btn--primary"
        @click="openNewPageForm"
      >
        + New Page
      </button>
    </header>

    <!-- Error Banner -->
    <div v-if="error" class="op-sitemap__error" role="alert">
      {{ error }}
      <button class="op-sitemap__error-dismiss" @click="error = null">
        Dismiss
      </button>
    </div>

    <!-- New Page Form -->
    <div v-if="showNewPageForm" class="op-sitemap__form">
      <h2 class="op-sitemap__form-title">Create New Page</h2>
      <div class="op-sitemap__form-fields">
        <label class="op-sitemap__label">
          Title
          <input
            v-model="newPageTitle"
            class="op-sitemap__input"
            type="text"
            placeholder="My New Page"
            @keydown.enter="submitNewPage"
          />
        </label>
        <label class="op-sitemap__label">
          Slug
          <input
            v-model="newPageSlug"
            class="op-sitemap__input"
            type="text"
            placeholder="my-new-page"
            @keydown.enter="submitNewPage"
          />
        </label>
      </div>
      <div class="op-sitemap__form-actions">
        <button
          class="op-sitemap__btn op-sitemap__btn--primary"
          :disabled="!newPageTitle.trim() || !newPageSlug.trim()"
          @click="submitNewPage"
        >
          Create
        </button>
        <button class="op-sitemap__btn" @click="cancelNewPage">
          Cancel
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="op-sitemap__loading">
      Loading pages...
    </div>

    <!-- Empty State -->
    <div v-else-if="tree.length === 0 && !showNewPageForm" class="op-sitemap__empty">
      <p>No pages yet.</p>
      <button class="op-sitemap__btn op-sitemap__btn--primary" @click="openNewPageForm">
        Create your first page
      </button>
    </div>

    <!-- Tree -->
    <ul v-else class="op-sitemap__tree" role="tree">
      <li
        v-for="node in tree"
        :key="node.slug"
        class="op-sitemap__tree-root"
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

    <!-- Delete Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="confirmDeleteSlug"
        class="op-sitemap__overlay"
        @click.self="cancelDelete"
      >
        <div class="op-sitemap__dialog" role="alertdialog">
          <h3>Delete Page</h3>
          <p>
            Are you sure you want to delete
            <strong>{{ confirmDeleteSlug }}</strong>?
            This action cannot be undone.
          </p>
          <div class="op-sitemap__dialog-actions">
            <button
              class="op-sitemap__btn op-sitemap__btn--danger"
              @click="confirmDelete"
            >
              Delete
            </button>
            <button class="op-sitemap__btn" @click="cancelDelete">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
.op-sitemap {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
  color: #1a1a2e;
}

.op-sitemap__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.op-sitemap__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.op-sitemap__btn {
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

.op-sitemap__btn:hover {
  background: #f3f4f6;
}

.op-sitemap__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.op-sitemap__btn--primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.op-sitemap__btn--primary:hover {
  background: #1d4ed8;
}

.op-sitemap__btn--danger {
  background: #dc2626;
  color: #fff;
  border-color: #dc2626;
}

.op-sitemap__btn--danger:hover {
  background: #b91c1c;
}

.op-sitemap__error {
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

.op-sitemap__error-dismiss {
  background: none;
  border: none;
  color: #991b1b;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.8rem;
}

.op-sitemap__form {
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.op-sitemap__form-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
}

.op-sitemap__form-fields {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.op-sitemap__label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 500;
  flex: 1;
}

.op-sitemap__input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
}

.op-sitemap__input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.op-sitemap__form-actions {
  display: flex;
  gap: 0.5rem;
}

.op-sitemap__loading {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
}

.op-sitemap__empty {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.op-sitemap__empty p {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.op-sitemap__tree {
  list-style: none;
  padding: 0;
  margin: 0;
}

.op-sitemap__tree-root {
  list-style: none;
}

/* Delete confirmation overlay */
.op-sitemap__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.op-sitemap__dialog {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.op-sitemap__dialog h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.op-sitemap__dialog p {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: #4b5563;
}

.op-sitemap__dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
