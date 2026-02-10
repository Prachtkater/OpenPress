import type { ContentType } from './types'

/**
 * Resolves a relative file path to its OpenPress content type.
 * Returns null if the path is not a recognized content file.
 *
 * @param relativePath - Path relative to project root (e.g. "content/pages/about.json")
 * @param contentDir - Content directory name (e.g. "content" or "./content")
 */
export function resolveContentType(relativePath: string, contentDir: string): ContentType | null {
  // Normalize contentDir: strip leading "./" if present
  const normalizedContentDir = contentDir.replace(/^\.\//, '')

  // Must be inside content dir and be a JSON file
  if (!relativePath.startsWith(normalizedContentDir + '/')) return null
  if (!relativePath.endsWith('.json')) return null

  // Strip content dir prefix to get the inner path
  const innerPath = relativePath
    .slice(normalizedContentDir.length + 1)
    .replace(/\\/g, '/')

  // content/pages/about.json → { type: 'page', slug: 'about' }
  // content/pages/blog/my-post.json → { type: 'page', slug: 'blog/my-post' }
  if (innerPath.startsWith('pages/') && innerPath.endsWith('.json')) {
    const slug = innerPath
      .slice('pages/'.length)
      .slice(0, -'.json'.length)
    return { type: 'page', slug }
  }

  // content/site.json → { type: 'site' }
  if (innerPath === 'site.json') {
    return { type: 'site' }
  }

  // content/navigation.json → { type: 'navigation' }
  if (innerPath === 'navigation.json') {
    return { type: 'navigation' }
  }

  return null
}
