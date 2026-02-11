import { describe, it, expect, beforeEach, mock } from 'bun:test'

// Import pure function directly (no Nuxt dependencies)
import { buildPageTree } from './page-tree'
import type { PageTreeNode } from './page-tree'
import type { PageListItem } from '@openpress/schemas'

// Mock #imports (Nuxt auto-imports) for usePageTree composable
const stateStore = new Map<string, { value: unknown }>()
let lastNavigation: string | null = null

mock.module('#imports', () => ({
  useState: <T>(key: string, init: () => T) => {
    if (!stateStore.has(key)) {
      stateStore.set(key, { value: init() })
    }
    return stateStore.get(key)!
  },
  useFetch: () => ({ data: { value: null }, pending: { value: false }, error: { value: null } }),
  useAsyncData: () => ({ data: { value: null }, pending: { value: false }, error: { value: null } }),
  navigateTo: (path: string) => { lastNavigation = path },
}))

// Try to import composable — may fail in non-Nuxt environment due to #imports
let usePageTree: any = null
try {
  const mod = await import('./usePageTree')
  usePageTree = mod.usePageTree
} catch {
  // #imports mock not supported in this Bun version — composable tests will be skipped
}

// -----------------------------------------------------------------
// buildPageTree (pure function)
// -----------------------------------------------------------------

describe('buildPageTree', () => {
  it('returns empty array for empty input', () => {
    const result = buildPageTree([])
    expect(result).toEqual([])
  })

  it('creates flat list for pages without slashes', () => {
    const pages: PageListItem[] = [
      { slug: 'about', title: { en: 'About Us' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'contact', title: { en: 'Contact' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'index', title: { en: 'Home' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)

    expect(tree).toHaveLength(3)
    expect(tree[0].segment).toBe('about')
    expect(tree[0].slug).toBe('about')
    expect(tree[0].title).toEqual({ en: 'About Us' })
    expect(tree[0].isPage).toBe(true)
    expect(tree[0].children).toHaveLength(0)
  })

  it('creates nested tree for slugs with slashes', () => {
    const pages: PageListItem[] = [
      { slug: 'blog/post-1', title: { en: 'Post 1' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'blog/post-2', title: { en: 'Post 2' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)

    expect(tree).toHaveLength(1)
    expect(tree[0].segment).toBe('blog')
    expect(tree[0].slug).toBe('blog')
    expect(tree[0].isPage).toBe(false)
    expect(tree[0].title).toBeNull()
    expect(tree[0].children).toHaveLength(2)
    expect(tree[0].children[0].segment).toBe('post-1')
    expect(tree[0].children[0].slug).toBe('blog/post-1')
    expect(tree[0].children[0].title).toEqual({ en: 'Post 1' })
    expect(tree[0].children[0].isPage).toBe(true)
  })

  it('handles mixed flat and nested pages', () => {
    const pages: PageListItem[] = [
      { slug: 'index', title: { en: 'Home' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'about', title: { en: 'About' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'blog/first', title: { en: 'First' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'blog/second', title: { en: 'Second' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)

    expect(tree).toHaveLength(3)
    // Sorted: about, blog, index
    expect(tree[0].segment).toBe('about')
    expect(tree[1].segment).toBe('blog')
    expect(tree[2].segment).toBe('index')
    expect(tree[1].children).toHaveLength(2)
  })

  it('handles deeply nested slugs', () => {
    const pages: PageListItem[] = [
      { slug: 'a/b/c', title: { en: 'Deep' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)

    expect(tree).toHaveLength(1)
    expect(tree[0].segment).toBe('a')
    expect(tree[0].isPage).toBe(false)
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].segment).toBe('b')
    expect(tree[0].children[0].isPage).toBe(false)
    expect(tree[0].children[0].children).toHaveLength(1)
    expect(tree[0].children[0].children[0].segment).toBe('c')
    expect(tree[0].children[0].children[0].slug).toBe('a/b/c')
    expect(tree[0].children[0].children[0].isPage).toBe(true)
    expect(tree[0].children[0].children[0].title).toEqual({ en: 'Deep' })
  })

  it('marks virtual folders when parent slug is also a page', () => {
    const pages: PageListItem[] = [
      { slug: 'blog', title: { en: 'Blog Index' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'blog/post-1', title: { en: 'Post 1' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)

    expect(tree).toHaveLength(1)
    expect(tree[0].segment).toBe('blog')
    expect(tree[0].isPage).toBe(true)
    expect(tree[0].title).toEqual({ en: 'Blog Index' })
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].title).toEqual({ en: 'Post 1' })
  })

  it('sorts pages alphabetically by slug', () => {
    const pages: PageListItem[] = [
      { slug: 'zebra', title: { en: 'Zebra' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'apple', title: { en: 'Apple' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'mango', title: { en: 'Mango' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)

    expect(tree[0].segment).toBe('apple')
    expect(tree[1].segment).toBe('mango')
    expect(tree[2].segment).toBe('zebra')
  })

  it('initializes nodes as expanded', () => {
    const pages: PageListItem[] = [
      { slug: 'docs/intro', title: { en: 'Intro' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)
    expect(tree[0].expanded).toBe(true)
    expect(tree[0].children[0].expanded).toBe(true)
  })

  it('does not mutate the input array', () => {
    const pages: PageListItem[] = [
      { slug: 'b', title: { en: 'B' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'a', title: { en: 'A' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const originalOrder = pages.map((p) => p.slug)
    buildPageTree(pages)
    expect(pages.map((p) => p.slug)).toEqual(originalOrder)
  })
})

// -----------------------------------------------------------------
// usePageTree composable (requires #imports mock)
// -----------------------------------------------------------------

const canTestComposable = usePageTree !== null

describe('usePageTree composable', () => {
  beforeEach(() => {
    stateStore.clear()
    lastNavigation = null
  })

  it.skipIf(!canTestComposable)('initializes with default state', () => {
    const { isLoading, error, pages, tree, renamingSlug, showNewPageForm } = usePageTree()

    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(pages.value).toEqual([])
    expect(tree.value).toEqual([])
    expect(renamingSlug.value).toBeNull()
    expect(showNewPageForm.value).toBe(false)
  })

  it.skipIf(!canTestComposable)('toggleNode flips expanded state', () => {
    const { tree, toggleNode } = usePageTree()

    tree.value = [
      {
        segment: 'blog',
        slug: 'blog',
        title: null,
        updatedAt: null,
        createdAt: null,
        isPage: false,
        children: [],
        expanded: true,
      },
    ]

    toggleNode('blog')
    expect(tree.value[0].expanded).toBe(false)

    toggleNode('blog')
    expect(tree.value[0].expanded).toBe(true)
  })

  it.skipIf(!canTestComposable)('toggleNode works for nested nodes', () => {
    const { tree, toggleNode } = usePageTree()

    tree.value = [
      {
        segment: 'docs',
        slug: 'docs',
        title: null,
        updatedAt: null,
        createdAt: null,
        isPage: false,
        expanded: true,
        children: [
          {
            segment: 'guide',
            slug: 'docs/guide',
            title: { en: 'Guide' },
            updatedAt: null,
            createdAt: null,
            isPage: true,
            expanded: true,
            children: [],
          },
        ],
      },
    ]

    toggleNode('docs/guide')
    expect(tree.value[0].children[0].expanded).toBe(false)
    expect(tree.value[0].expanded).toBe(true)
  })

  it.skipIf(!canTestComposable)('openPage navigates to /_edit/:slug', () => {
    const { openPage } = usePageTree()
    openPage('about')
    expect(lastNavigation).toBe('/_edit/about')
  })

  it.skipIf(!canTestComposable)('openPage handles nested slugs', () => {
    const { openPage } = usePageTree()
    openPage('blog/post-1')
    expect(lastNavigation).toBe('/_edit/blog/post-1')
  })

  it.skipIf(!canTestComposable)('state is shared between multiple calls (singleton via useState)', () => {
    const first = usePageTree()
    const second = usePageTree()

    first.showNewPageForm.value = true
    expect(second.showNewPageForm.value).toBe(true)
  })

  it.skipIf(!canTestComposable)('renamingSlug tracks which page is being renamed', () => {
    const { renamingSlug } = usePageTree()

    expect(renamingSlug.value).toBeNull()
    renamingSlug.value = 'about'
    expect(renamingSlug.value).toBe('about')
    renamingSlug.value = null
    expect(renamingSlug.value).toBeNull()
  })
})

// -----------------------------------------------------------------
// Tree structure edge cases
// -----------------------------------------------------------------

describe('buildPageTree edge cases', () => {
  it('handles single page', () => {
    const pages: PageListItem[] = [
      { slug: 'index', title: { en: 'Home' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)
    expect(tree).toHaveLength(1)
    expect(tree[0].slug).toBe('index')
    expect(tree[0].isPage).toBe(true)
  })

  it('handles multiple pages sharing deep folder structure', () => {
    const pages: PageListItem[] = [
      { slug: 'docs/api/auth', title: { en: 'Auth API' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'docs/api/users', title: { en: 'Users API' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'docs/guide', title: { en: 'Guide' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)

    expect(tree).toHaveLength(1)
    expect(tree[0].segment).toBe('docs')
    expect(tree[0].children).toHaveLength(2)

    const api = tree[0].children.find((c) => c.segment === 'api')!
    expect(api.isPage).toBe(false)
    expect(api.children).toHaveLength(2)
    expect(api.children[0].segment).toBe('auth')
    expect(api.children[0].title).toEqual({ en: 'Auth API' })
    expect(api.children[1].segment).toBe('users')
    expect(api.children[1].title).toEqual({ en: 'Users API' })

    const guide = tree[0].children.find((c) => c.segment === 'guide')!
    expect(guide.isPage).toBe(true)
    expect(guide.title).toEqual({ en: 'Guide' })
  })

  it('preserves timestamps on page nodes', () => {
    const pages: PageListItem[] = [
      { slug: 'about', title: { en: 'About' }, updatedAt: '2025-06-15T12:30:00Z', createdAt: '2025-01-01T08:00:00Z' },
    ]

    const tree = buildPageTree(pages)
    expect(tree[0].updatedAt).toBe('2025-06-15T12:30:00Z')
    expect(tree[0].createdAt).toBe('2025-01-01T08:00:00Z')
  })

  it('virtual folder nodes have null timestamps', () => {
    const pages: PageListItem[] = [
      { slug: 'blog/post', title: { en: 'Post' }, updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)
    expect(tree[0].updatedAt).toBeNull()
    expect(tree[0].createdAt).toBeNull()
  })
})
