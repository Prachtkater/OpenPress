import type { PageTreeNode } from './page-tree'

export interface MindmapNode {
  id: string
  name: string
  title: string | null
  slug: string
  isPage: boolean
  children?: MindmapNode[]
  /** SVG/D3 specific properties can be added here later (e.g., x, y, fx, fy) */
}

export interface MindmapLink {
  source: string
  target: string
}

export interface MindmapData {
  root: MindmapNode
  links: MindmapLink[]
}

/**
 * Transforms a PageTreeNode (hierarchical) into a MindmapNode structure.
 * This is similar but might be optimized for D3's hierarchy/tree layouts.
 */
export function transformToMindmap(tree: PageTreeNode[]): MindmapNode {
  // Create a virtual root node to hold all top-level pages
  const virtualRoot: MindmapNode = {
    id: 'root',
    name: 'Site',
    title: 'Site Root',
    slug: '',
    isPage: false,
    children: tree.map(node => convertNode(node))
  }

  return virtualRoot
}

function convertNode(node: PageTreeNode): MindmapNode {
  return {
    id: node.slug,
    name: node.segment,
    title: node.title,
    slug: node.slug,
    isPage: node.isPage,
    children: node.children.length > 0 
      ? node.children.map(child => convertNode(child))
      : undefined
  }
}

/**
 * Flatten the tree into nodes and links for force-directed graph layouts.
 */
export function flattenMindmap(root: MindmapNode): MindmapData {
  const nodes: MindmapNode[] = []
  const links: MindmapLink[] = []

  function traverse(node: MindmapNode) {
    // We don't push 'root' to nodes if we want only real pages/folders,
    // but usually D3 needs all nodes.
    nodes.push(node)

    if (node.children) {
      for (const child of node.children) {
        links.push({
          source: node.id,
          target: child.id
        })
        traverse(child)
      }
    }
  }

  traverse(root)

  return { root, links }
}
