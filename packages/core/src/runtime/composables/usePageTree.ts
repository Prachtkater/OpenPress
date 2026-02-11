import { useState, useFetch, useAsyncData, navigateTo } from '#imports'
import { ulid } from 'ulid'
import type { PageListItem, Page } from '@openpress/schemas'

export interface PageTreeNode {
  /** Slug segment (e.g. "about" in "company/about") */
  segment: string
  /** Full slug path (e.g. "company/about") */
  slug: string
  /** Page title — only set for actual pages */
  title: string | null
  /** Timestamps — only set for actual pages */
  updatedAt: string | null
  createdAt: string | null
  /** Whether this node represents an actual page (vs. a virtual folder) */
  isPage: boolean
  /** Child nodes */
  children: PageTreeNode[]
  /** UI state: expanded in tree */
  expanded: boolean
}

/**
 * Build a tree structure from a flat list of pages.
 * Slugs with "/" are treated as nested (e.g. "blog/post-1" → blog → post-1).
 */
export function buildPageTree(pages: PageListItem[]): PageTreeNode[] {
  const root: PageTreeNode[] = []

  const sorted = [...pages].sort((a, b) => a.slug.localeCompare(b.slug))

  for (const page of sorted) {
    const segments = page.slug.split('/')
    let currentLevel = root

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const fullSlug = segments.slice(0, i + 1).join('/')
      const isLeaf = i === segments.length - 1

      let existing = currentLevel.find((n) => n.segment === segment)

      if (!existing) {
        existing = {
          segment,
          slug: fullSlug,
          title: isLeaf ? page.title : null,
          updatedAt: isLeaf ? page.updatedAt : null,
          createdAt: isLeaf ? page.createdAt : null,
          isPage: isLeaf,
          children: [],
          expanded: true,
        }
        currentLevel.push(existing)
      } else if (isLeaf) {
        // Node existed as virtual folder, now mark as page
        existing.title = page.title
        existing.updatedAt = page.updatedAt
        existing.createdAt = page.createdAt
        existing.isPage = true
      }

      currentLevel = existing.children
    }
  }

  return root
}

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
  }
}
