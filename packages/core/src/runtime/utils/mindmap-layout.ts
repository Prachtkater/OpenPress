/**
 * Radial Mindmap Layout Algorithm
 *
 * Pure math layout — no D3.js dependency.
 * Places root at center, 1st-level children in a circle (r1),
 * 2nd-level children in arcs around their parent (r2).
 */

export interface MindmapNode {
  slug: string
  label: string
  isPage: boolean
  children: MindmapNode[]
}

export interface LayoutNode {
  slug: string
  label: string
  isPage: boolean
  x: number
  y: number
  depth: number
}

export interface LayoutLink {
  from: string
  to: string
  path: string
  midX: number
  midY: number
}

export interface MindmapLayout {
  nodes: LayoutNode[]
  links: LayoutLink[]
  width: number
  height: number
}

/**
 * Build a quadratic bezier SVG path between two points with a slight curve.
 * The control point is offset perpendicular to the midpoint.
 */
function buildCurvedPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { path: string; midX: number; midY: number } {
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  // Perpendicular offset for gentle curve
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const offset = len * 0.1
  const cpX = midX + (dy / len) * offset
  const cpY = midY - (dx / len) * offset

  return {
    path: `M ${x1} ${y1} Q ${cpX} ${cpY} ${x2} ${y2}`,
    midX,
    midY,
  }
}

export function computeRadialLayout(
  root: MindmapNode,
  options: {
    cx?: number
    cy?: number
    r1?: number
    r2?: number
    padding?: number
  } = {},
): MindmapLayout {
  const cx = options.cx ?? 400
  const cy = options.cy ?? 300
  const r1 = options.r1 ?? 180
  const r2 = options.r2 ?? 120
  const padding = options.padding ?? 80

  const nodes: LayoutNode[] = []
  const links: LayoutLink[] = []

  // Root node at center
  nodes.push({
    slug: root.slug,
    label: root.label,
    isPage: root.isPage,
    x: cx,
    y: cy,
    depth: 0,
  })

  const children = root.children
  if (children.length === 0) {
    return {
      nodes,
      links,
      width: (cx + padding) * 2,
      height: (cy + padding) * 2,
    }
  }

  // Distribute 1st-level children evenly in a circle
  const angleStep = (2 * Math.PI) / children.length
  // Start from top (-PI/2) for visual balance
  const startAngle = -Math.PI / 2

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const angle = startAngle + i * angleStep
    const childX = cx + r1 * Math.cos(angle)
    const childY = cy + r1 * Math.sin(angle)

    nodes.push({
      slug: child.slug,
      label: child.label,
      isPage: child.isPage,
      x: childX,
      y: childY,
      depth: 1,
    })

    // Link from root to child
    const { path, midX, midY } = buildCurvedPath(cx, cy, childX, childY)
    links.push({ from: root.slug, to: child.slug, path, midX, midY })

    // 2nd-level: grandchildren in an arc around parent
    const grandchildren = child.children
    if (grandchildren.length > 0) {
      // Arc spread around parent's angle
      const arcSpread = Math.min(Math.PI / 3, angleStep * 0.8)
      const gcAngleStep =
        grandchildren.length > 1 ? arcSpread / (grandchildren.length - 1) : 0
      const gcStartAngle = angle - arcSpread / 2

      for (let j = 0; j < grandchildren.length; j++) {
        const gc = grandchildren[j]
        const gcAngle =
          grandchildren.length === 1 ? angle : gcStartAngle + j * gcAngleStep
        const gcX = childX + r2 * Math.cos(gcAngle)
        const gcY = childY + r2 * Math.sin(gcAngle)

        nodes.push({
          slug: gc.slug,
          label: gc.label,
          isPage: gc.isPage,
          x: gcX,
          y: gcY,
          depth: 2,
        })

        const gcLink = buildCurvedPath(childX, childY, gcX, gcY)
        links.push({
          from: child.slug,
          to: gc.slug,
          path: gcLink.path,
          midX: gcLink.midX,
          midY: gcLink.midY,
        })
      }
    }
  }

  // Compute bounding box
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    if (n.x < minX) minX = n.x
    if (n.y < minY) minY = n.y
    if (n.x > maxX) maxX = n.x
    if (n.y > maxY) maxY = n.y
  }

  return {
    nodes,
    links,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  }
}
