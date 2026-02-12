import { describe, expect, it } from 'bun:test'
import {
  computeRadialLayout,
  type MindmapNode,
} from './mindmap-layout'

// Helper to create a simple node
function node(
  slug: string,
  children: MindmapNode[] = [],
  isPage = true,
): MindmapNode {
  return { slug, label: slug, isPage, children }
}

describe('computeRadialLayout', () => {
  it('handles root-only tree', () => {
    const layout = computeRadialLayout(node('home'))
    expect(layout.nodes).toHaveLength(1)
    expect(layout.links).toHaveLength(0)
    expect(layout.nodes[0].slug).toBe('home')
    expect(layout.nodes[0].depth).toBe(0)
  })

  it('places single child at top (angle = -PI/2)', () => {
    const root = node('home', [node('about')])
    const layout = computeRadialLayout(root, { cx: 400, cy: 300, r1: 180 })

    const child = layout.nodes.find((n) => n.slug === 'about')!
    expect(child.depth).toBe(1)
    // At -PI/2: x ≈ cx, y ≈ cy - r1
    expect(child.x).toBeCloseTo(400, 0)
    expect(child.y).toBeCloseTo(120, 0)
  })

  it('distributes multiple children evenly', () => {
    const root = node('home', [
      node('about'),
      node('services'),
      node('contact'),
    ])
    const layout = computeRadialLayout(root, { cx: 400, cy: 300, r1: 180 })

    expect(layout.nodes).toHaveLength(4)
    expect(layout.links).toHaveLength(3)

    // All children at depth 1 should be r1 from center
    const children = layout.nodes.filter((n) => n.depth === 1)
    for (const c of children) {
      const dist = Math.sqrt((c.x - 400) ** 2 + (c.y - 300) ** 2)
      expect(dist).toBeCloseTo(180, 0)
    }
  })

  it('positions grandchildren at depth 2', () => {
    const root = node('home', [
      node('services', [node('service-a'), node('service-b')]),
    ])
    const layout = computeRadialLayout(root)

    const grandchildren = layout.nodes.filter((n) => n.depth === 2)
    expect(grandchildren).toHaveLength(2)
    expect(layout.links).toHaveLength(3) // root→services, services→a, services→b
  })

  it('generates valid SVG paths', () => {
    const root = node('home', [node('about')])
    const layout = computeRadialLayout(root)

    for (const link of layout.links) {
      expect(link.path).toMatch(/^M [\d.]+ [\d.]+ Q [\d.-]+ [\d.-]+ [\d.]+ [\d.]+$/)
    }
  })

  it('computes link midpoints', () => {
    const root = node('home', [node('about')])
    const layout = computeRadialLayout(root, { cx: 400, cy: 300, r1: 180 })

    const link = layout.links[0]
    // Midpoint should be roughly between root and child
    expect(link.midX).toBeCloseTo(400, 0)
    expect(link.midY).toBeCloseTo(210, 0)
  })

  it('respects custom radii with multiple children', () => {
    const root = node('home', [
      node('a'),
      node('b'),
      node('c'),
    ])
    const small = computeRadialLayout(root, { r1: 100 })
    const large = computeRadialLayout(root, { r1: 250 })

    expect(small.width).not.toBe(large.width)
  })

  it('uses label from node', () => {
    const n: MindmapNode = {
      slug: 'test-slug',
      label: 'Test Label',
      isPage: true,
      children: [],
    }
    const layout = computeRadialLayout(n)
    expect(layout.nodes[0].label).toBe('Test Label')
  })

  it('preserves isPage flag', () => {
    const root = node('home', [
      { slug: 'virtual', label: 'Virtual', isPage: false, children: [] },
    ])
    const layout = computeRadialLayout(root)

    const virtualNode = layout.nodes.find((n) => n.slug === 'virtual')!
    expect(virtualNode.isPage).toBe(false)
  })

  it('handles realistic German garden site', () => {
    const root = node('home', [
      node('ueber-mich'),
      node('leistungen', [
        node('gartenplanung'),
        node('pflanzkonzepte'),
        node('pflege'),
      ]),
      node('referenzen'),
      node('kontakt'),
      node('blog'),
    ])

    const layout = computeRadialLayout(root)

    // 1 root + 5 children + 3 grandchildren = 9
    expect(layout.nodes).toHaveLength(9)
    // 5 root→child + 3 child→grandchild = 8
    expect(layout.links).toHaveLength(8)

    // All nodes have positive coordinates within bounds
    for (const n of layout.nodes) {
      expect(n.x).toBeGreaterThan(0)
      expect(n.y).toBeGreaterThan(0)
    }

    expect(layout.width).toBeGreaterThan(0)
    expect(layout.height).toBeGreaterThan(0)
  })

  it('produces non-overlapping node positions', () => {
    const root = node('home', [
      node('a'),
      node('b'),
      node('c'),
      node('d'),
    ])
    const layout = computeRadialLayout(root)
    const minDist = 40 // Minimum expected distance between nodes

    for (let i = 0; i < layout.nodes.length; i++) {
      for (let j = i + 1; j < layout.nodes.length; j++) {
        const a = layout.nodes[i]
        const b = layout.nodes[j]
        const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
        expect(dist).toBeGreaterThan(minDist)
      }
    }
  })

  it('returns correct depth levels for 3-tier tree', () => {
    const root = node('home', [
      node('services', [node('consulting')]),
    ])
    const layout = computeRadialLayout(root)

    const depths = layout.nodes.map((n) => ({ slug: n.slug, depth: n.depth }))
    expect(depths).toEqual([
      { slug: 'home', depth: 0 },
      { slug: 'services', depth: 1 },
      { slug: 'consulting', depth: 2 },
    ])
  })
})
