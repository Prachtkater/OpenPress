import { useState, useFetch, useAsyncData, navigateTo } from '#imports'
import { ulid } from 'ulid'
import type { PageListItem, Page } from '@openpress/schemas'
import { buildPageTree } from './page-tree'
import type { PageTreeNode } from './page-tree'
import { transformToMindmap, flattenMindmap } from './mindmap'

export { buildPageTree, type PageTreeNode }

/**
 * usePageTree — Composable for the Site Map tree view.
 *
 * Provides:
 * - Reactive tree of all pages
 * - CRUD operations (create, rename, delete)
 * - Expand/collapse state
 * - Navigation to page editor
 */
export function usePageTree() {
  const isLoading = useState<boolean>('openpress:pagetree:loading', () => false)
  const error = useState<string | null>('openpress:pagetree:error', () => null)
  const pages = useState<PageListItem[]>('openpress:pagetree:pages', () => [])
  const tree = useState<PageTreeNode[]>('openpress:pagetree:tree', () => [])

  /** Which node is being renamed (slug) */
  const renamingSlug = useState<string | null>('openpress:pagetree:renaming', () => null)
  /** Whether the "new page" form is visible */
  const showNewPageForm = useState<boolean>('openpress:pagetree:showNew', () => false)

  /**
   * Fetch pages from the API and rebuild the tree.
   */
  async function loadPages(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const data = await $fetch<PageListItem[]>('/api/_openpress/pages')
      pages.value = data
      tree.value = buildPageTree(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load pages'
      error.value = message
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new page with the given slug and title.
   */
  async function createPage(slug: string, title: string): Promise<boolean> {
    error.value = null

    const now = new Date().toISOString()
    const newPage: Page = {
      id: ulid(),
      slug,
      title,
      meta: {},
      sections: [],
      updatedAt: now,
      createdAt: now,
    }

    try {
      await $fetch('/api/_openpress/pages', {
        method: 'POST',
        body: newPage,
      })
      await loadPages()
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create page'
      error.value = message
      return false
    }
  }

  /**
   * Delete a page by slug.
   */
  async function deletePage(slug: string): Promise<boolean> {
    error.value = null

    try {
      await $fetch(`/api/_openpress/pages/${slug}`, {
        method: 'DELETE',
      })
      await loadPages()
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete page'
      error.value = message
      return false
    }
  }

  /**
   * Rename a page (change title and/or slug).
   *
   * Since changing a slug means creating a new file and deleting the old one,
   * we read the full page, update the fields, write to the new slug, and delete the old one.
   */
  async function renamePage(
    oldSlug: string,
    newTitle: string,
    newSlug?: string,
  ): Promise<boolean> {
    error.value = null

    try {
      // Read the full page data
      const page = await $fetch<Page>(`/api/_openpress/pages/${oldSlug}`)

      const updatedPage: Page = {
        ...page,
        title: newTitle,
        slug: newSlug ?? page.slug,
        updatedAt: new Date().toISOString(),
      }

      if (newSlug && newSlug !== oldSlug) {
        // Slug changed: create new, delete old
        await $fetch('/api/_openpress/pages', {
          method: 'POST',
          body: updatedPage,
        })
        await $fetch(`/api/_openpress/pages/${oldSlug}`, {
          method: 'DELETE',
        })
      } else {
        // Only title changed
        await $fetch(`/api/_openpress/pages/${oldSlug}`, {
          method: 'PUT',
          body: updatedPage,
        })
      }

      renamingSlug.value = null
      await loadPages()
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to rename page'
      error.value = message
      return false
    }
  }

  /**
   * Toggle expand/collapse of a tree node.
   */
  function toggleNode(slug: string): void {
    function toggle(nodes: PageTreeNode[]): boolean {
      for (const node of nodes) {
        if (node.slug === slug) {
          node.expanded = !node.expanded
          return true
        }
        if (toggle(node.children)) return true
      }
      return false
    }
    toggle(tree.value)
  }

  /**
   * Navigate to the page editor for a given slug.
   */
  function openPage(slug: string): void {
    navigateTo(`/_edit/${slug}`)
  }

  /**
   * Get Mindmap data for SVG/D3 rendering.
   */
  function getMindmapData() {
    const root = transformToMindmap(tree.value)
    return {
      hierarchy: root,
      flat: flattenMindmap(root),
    }
  }

  return {
    isLoading,
    error,
    pages,
    tree,
    renamingSlug,
    showNewPageForm,
    loadPages,
    createPage,
    deletePage,
    renamePage,
    toggleNode,
    openPage,
    getMindmapData,
  }
}
