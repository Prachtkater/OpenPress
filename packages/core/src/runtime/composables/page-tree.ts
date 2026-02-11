import type { PageListItem } from '@openpress/schemas'

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
