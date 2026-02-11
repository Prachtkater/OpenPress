import { describe, it, expect, beforeEach, mock } from 'bun:test'

// Mock #imports (Nuxt auto-imports)
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

// Import after mocking
const { buildPageTree, usePageTree } = await import('./usePageTree')
import type { PageTreeNode } from './usePageTree'
import type { PageListItem } from '@openpress/schemas'

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
      { slug: 'about', title: 'About Us', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'contact', title: 'Contact', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'index', title: 'Home', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)

    expect(tree).toHaveLength(3)
    expect(tree[0].segment).toBe('about')
    expect(tree[0].slug).toBe('about')
    expect(tree[0].title).toBe('About Us')
    expect(tree[0].isPage).toBe(true)
    expect(tree[0].children).toHaveLength(0)
  })

  it('creates nested tree for slugs with slashes', () => {
    const pages: PageListItem[] = [
      { slug: 'blog/post-1', title: 'Post 1', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'blog/post-2', title: 'Post 2', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
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
    expect(tree[0].children[0].title).toBe('Post 1')
    expect(tree[0].children[0].isPage).toBe(true)
  })

  it('handles mixed flat and nested pages', () => {
    const pages: PageListItem[] = [
      { slug: 'index', title: 'Home', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'about', title: 'About', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'blog/first', title: 'First', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'blog/second', title: 'Second', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
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
      { slug: 'a/b/c', title: 'Deep', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
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
    expect(tree[0].children[0].children[0].title).toBe('Deep')
  })

  it('marks virtual folders when parent slug is also a page', () => {
    const pages: PageListItem[] = [
      { slug: 'blog', title: 'Blog Index', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'blog/post-1', title: 'Post 1', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)

    expect(tree).toHaveLength(1)
    expect(tree[0].segment).toBe('blog')
    expect(tree[0].isPage).toBe(true)
    expect(tree[0].title).toBe('Blog Index')
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].title).toBe('Post 1')
  })

  it('sorts pages alphabetically by slug', () => {
    const pages: PageListItem[] = [
      { slug: 'zebra', title: 'Zebra', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'apple', title: 'Apple', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'mango', title: 'Mango', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)

    expect(tree[0].segment).toBe('apple')
    expect(tree[1].segment).toBe('mango')
    expect(tree[2].segment).toBe('zebra')
  })

  it('initializes nodes as expanded', () => {
    const pages: PageListItem[] = [
      { slug: 'docs/intro', title: 'Intro', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)
    expect(tree[0].expanded).toBe(true)
    expect(tree[0].children[0].expanded).toBe(true)
  })

  it('does not mutate the input array', () => {
    const pages: PageListItem[] = [
      { slug: 'b', title: 'B', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'a', title: 'A', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const originalOrder = pages.map((p) => p.slug)
    buildPageTree(pages)
    expect(pages.map((p) => p.slug)).toEqual(originalOrder)
  })
})

// -----------------------------------------------------------------
// usePageTree composable
// -----------------------------------------------------------------

describe('usePageTree composable', () => {
  beforeEach(() => {
    stateStore.clear()
    lastNavigation = null
  })

  it('initializes with default state', () => {
    const { isLoading, error, pages, tree, renamingSlug, showNewPageForm } = usePageTree()

    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(pages.value).toEqual([])
    expect(tree.value).toEqual([])
    expect(renamingSlug.value).toBeNull()
    expect(showNewPageForm.value).toBe(false)
  })

  it('toggleNode flips expanded state', () => {
    const { tree, toggleNode } = usePageTree()

    // Manually set tree with a node
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

  it('toggleNode works for nested nodes', () => {
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
            title: 'Guide',
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
    // Parent should remain expanded
    expect(tree.value[0].expanded).toBe(true)
  })

  it('openPage navigates to /_edit/:slug', () => {
    const { openPage } = usePageTree()
    openPage('about')
    expect(lastNavigation).toBe('/_edit/about')
  })

  it('openPage handles nested slugs', () => {
    const { openPage } = usePageTree()
    openPage('blog/post-1')
    expect(lastNavigation).toBe('/_edit/blog/post-1')
  })

  it('state is shared between multiple calls (singleton via useState)', () => {
    const first = usePageTree()
    const second = usePageTree()

    first.showNewPageForm.value = true
    expect(second.showNewPageForm.value).toBe(true)
  })

  it('renamingSlug tracks which page is being renamed', () => {
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
      { slug: 'index', title: 'Home', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)
    expect(tree).toHaveLength(1)
    expect(tree[0].slug).toBe('index')
    expect(tree[0].isPage).toBe(true)
  })

  it('handles multiple pages sharing deep folder structure', () => {
    const pages: PageListItem[] = [
      { slug: 'docs/api/auth', title: 'Auth API', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'docs/api/users', title: 'Users API', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
      { slug: 'docs/guide', title: 'Guide', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)

    expect(tree).toHaveLength(1) // docs
    expect(tree[0].segment).toBe('docs')
    expect(tree[0].children).toHaveLength(2) // api, guide

    const api = tree[0].children.find((c) => c.segment === 'api')!
    expect(api.isPage).toBe(false)
    expect(api.children).toHaveLength(2)
    expect(api.children[0].segment).toBe('auth')
    expect(api.children[0].title).toBe('Auth API')
    expect(api.children[1].segment).toBe('users')
    expect(api.children[1].title).toBe('Users API')

    const guide = tree[0].children.find((c) => c.segment === 'guide')!
    expect(guide.isPage).toBe(true)
    expect(guide.title).toBe('Guide')
  })

  it('preserves timestamps on page nodes', () => {
    const pages: PageListItem[] = [
      { slug: 'about', title: 'About', updatedAt: '2025-06-15T12:30:00Z', createdAt: '2025-01-01T08:00:00Z' },
    ]

    const tree = buildPageTree(pages)
    expect(tree[0].updatedAt).toBe('2025-06-15T12:30:00Z')
    expect(tree[0].createdAt).toBe('2025-01-01T08:00:00Z')
  })

  it('virtual folder nodes have null timestamps', () => {
    const pages: PageListItem[] = [
      { slug: 'blog/post', title: 'Post', updatedAt: '2025-01-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    ]

    const tree = buildPageTree(pages)
    expect(tree[0].updatedAt).toBeNull()
    expect(tree[0].createdAt).toBeNull()
  })
})
