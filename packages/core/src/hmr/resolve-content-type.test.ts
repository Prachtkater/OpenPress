import { describe, it, expect } from 'bun:test'
import { resolveContentType } from './resolve-content-type'

describe('resolveContentType', () => {
  const contentDir = './content'

  describe('page resolution', () => {
    it('resolves a simple page path', () => {
      const result = resolveContentType('content/pages/about.json', contentDir)
      expect(result).toEqual({ type: 'page', slug: 'about' })
    })

    it('resolves a nested page path', () => {
      const result = resolveContentType('content/pages/blog/my-post.json', contentDir)
      expect(result).toEqual({ type: 'page', slug: 'blog/my-post' })
    })

    it('resolves a deeply nested page path', () => {
      const result = resolveContentType('content/pages/docs/guides/getting-started.json', contentDir)
      expect(result).toEqual({ type: 'page', slug: 'docs/guides/getting-started' })
    })

    it('resolves index page', () => {
      const result = resolveContentType('content/pages/index.json', contentDir)
      expect(result).toEqual({ type: 'page', slug: 'index' })
    })
  })

  describe('site resolution', () => {
    it('resolves site.json', () => {
      const result = resolveContentType('content/site.json', contentDir)
      expect(result).toEqual({ type: 'site' })
    })
  })

  describe('navigation resolution', () => {
    it('resolves navigation.json', () => {
      const result = resolveContentType('content/navigation.json', contentDir)
      expect(result).toEqual({ type: 'navigation' })
    })
  })

  describe('ignored paths', () => {
    it('returns null for non-JSON files', () => {
      expect(resolveContentType('content/pages/about.md', contentDir)).toBeNull()
    })

    it('returns null for files outside content directory', () => {
      expect(resolveContentType('src/pages/about.json', contentDir)).toBeNull()
    })

    it('returns null for unrecognized JSON files in content root', () => {
      expect(resolveContentType('content/unknown.json', contentDir)).toBeNull()
    })

    it('returns null for JSON files in unrecognized subdirectories', () => {
      expect(resolveContentType('content/assets/image.json', contentDir)).toBeNull()
    })

    it('returns null for files in partial path matches', () => {
      expect(resolveContentType('content-backup/pages/about.json', contentDir)).toBeNull()
    })

    it('returns null for non-JSON in pages directory', () => {
      expect(resolveContentType('content/pages/about.ts', contentDir)).toBeNull()
    })
  })

  describe('contentDir normalization', () => {
    it('works with contentDir without leading ./', () => {
      const result = resolveContentType('content/pages/about.json', 'content')
      expect(result).toEqual({ type: 'page', slug: 'about' })
    })

    it('works with contentDir with leading ./', () => {
      const result = resolveContentType('content/pages/about.json', './content')
      expect(result).toEqual({ type: 'page', slug: 'about' })
    })

    it('works with custom content directory name', () => {
      const result = resolveContentType('data/pages/about.json', './data')
      expect(result).toEqual({ type: 'page', slug: 'about' })
    })
  })

  describe('backslash normalization', () => {
    it('normalizes Windows-style paths in page slugs', () => {
      // The relativePath should already use forward slashes from Nuxt,
      // but the inner path normalization handles backslashes
      const result = resolveContentType('content/pages/blog/my-post.json', contentDir)
      expect(result).toEqual({ type: 'page', slug: 'blog/my-post' })
    })
  })
})
