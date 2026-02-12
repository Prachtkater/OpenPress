<script setup lang="ts">
/**
 * OpMindmap — Radial Bubble Mindmap with Liquid Glass Design
 *
 * Renders the page tree as an interactive SVG mindmap.
 * Center bubble = homepage, 1st ring = top-level pages, 2nd ring = sub-pages.
 * Plus buttons on link midpoints allow adding child pages.
 */
import { computed } from 'vue'
import {
  computeRadialLayout,
  type MindmapNode,
  type LayoutNode,
} from '../utils/mindmap-layout'

interface PageTreeNode {
  slug: string
  title?: string
  children: PageTreeNode[]
}

const props = defineProps<{
  tree: PageTreeNode[]
}>()

const emit = defineEmits<{
  'open-page': [slug: string]
  'add-page': [parentSlug: string]
}>()

/** Convert PageTreeNode[] to a single MindmapNode root */
function toMindmapRoot(tree: PageTreeNode[]): MindmapNode {
  function convert(node: PageTreeNode): MindmapNode {
    return {
      slug: node.slug,
      label: node.title ?? node.slug,
      isPage: true,
      children: node.children.map(convert),
    }
  }

  // Single top-level page becomes the root
  if (tree.length === 1) {
    return convert(tree[0])
  }

  // Virtual root wrapping all top-level pages — uses non-colliding slug
  return {
    slug: '__root__',
    label: 'Home',
    isPage: false,
    children: tree.map(convert),
  }
}

const layout = computed(() => {
  if (props.tree.length === 0) return null
  const root = toMindmapRoot(props.tree)
  return computeRadialLayout(root, {
    cx: 450,
    cy: 350,
    r1: 200,
    r2: 130,
    padding: 100,
  })
})

/** Bubble radius by depth */
function bubbleRadius(node: LayoutNode): number {
  if (node.depth === 0) return 52
  if (node.depth === 1) return 40
  return 32
}

/** Truncate labels for SVG rendering */
function truncateLabel(label: string, maxLen: number): string {
  return label.length > maxLen ? label.slice(0, maxLen - 1) + '\u2026' : label
}

function openNode(node: LayoutNode) {
  if (!node.isPage) return
  emit('open-page', node.slug)
}
</script>

<template>
  <div class="op-mindmap">
    <div v-if="!layout" class="op-mindmap__empty">
      No pages to visualize.
    </div>

    <svg
      v-else
      :viewBox="`0 0 ${layout.width} ${layout.height}`"
      class="op-mindmap__svg"
      role="img"
      aria-label="Page tree mindmap"
    >
      <defs>
        <!-- Liquid Glass gradients -->
        <radialGradient id="glass-bubble" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.85)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0.45)" />
        </radialGradient>
        <radialGradient id="glass-bubble-root" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="rgba(37,99,235,0.8)" />
          <stop offset="100%" stop-color="rgba(37,99,235,0.5)" />
        </radialGradient>
        <radialGradient id="glass-bubble-hover" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.95)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0.7)" />
        </radialGradient>

        <!-- Drop shadow filters -->
        <filter id="glass-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.12)" />
        </filter>
        <filter id="glass-shadow-hover" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.18)" />
        </filter>
      </defs>

      <!-- Links -->
      <g class="op-mindmap__links">
        <g
          v-for="link in layout.links"
          :key="`${link.from}-${link.to}`"
          class="op-mindmap__link-group"
        >
          <path
            :d="link.path"
            class="op-mindmap__link"
            fill="none"
            stroke="rgba(148,163,184,0.5)"
            stroke-width="2"
          />
          <!-- Plus button at midpoint -->
          <g
            class="op-mindmap__add-btn"
            :transform="`translate(${link.midX}, ${link.midY})`"
            role="button"
            :aria-label="`Add child page under ${link.from}`"
            @click.stop="emit('add-page', link.from)"
          >
            <circle r="12" fill="url(#glass-bubble)" filter="url(#glass-shadow)" />
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#64748b" stroke-width="1.5" />
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#64748b" stroke-width="1.5" />
          </g>
        </g>
      </g>

      <!-- Nodes -->
      <g class="op-mindmap__nodes">
        <g
          v-for="node in layout.nodes"
          :key="node.slug"
          class="op-mindmap__node"
          :class="{
            'op-mindmap__node--root': node.depth === 0,
            'op-mindmap__node--page': node.isPage,
          }"
          :transform="`translate(${node.x}, ${node.y})`"
          role="button"
          :aria-label="`Open page: ${node.label}`"
          :aria-disabled="!node.isPage"
          :tabindex="node.isPage ? 0 : -1"
          @click="openNode(node)"
          @keydown.enter="openNode(node)"
        >
          <circle
            :r="bubbleRadius(node)"
            :fill="node.depth === 0 ? 'url(#glass-bubble-root)' : 'url(#glass-bubble)'"
            :stroke="node.depth === 0 ? 'rgba(37,99,235,0.3)' : 'rgba(148,163,184,0.3)'"
            stroke-width="1.5"
            filter="url(#glass-shadow)"
          />
          <text
            text-anchor="middle"
            dominant-baseline="central"
            :class="node.depth === 0 ? 'op-mindmap__label--root' : 'op-mindmap__label'"
            :font-size="node.depth === 0 ? 13 : node.depth === 1 ? 11 : 10"
          >
            {{ truncateLabel(node.label, node.depth === 0 ? 14 : 12) }}
          </text>
        </g>
      </g>
    </svg>
  </div>
</template>

<style>
.op-mindmap {
  width: 100%;
  overflow: hidden;
}

.op-mindmap__empty {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
}

.op-mindmap__svg {
  width: 100%;
  height: auto;
  min-height: 400px;
  max-height: 700px;
}

/* Node interactions */
.op-mindmap__node {
  cursor: pointer;
  transition: transform 0.15s ease;
}

.op-mindmap__node:hover circle {
  filter: url(#glass-shadow-hover);
}

.op-mindmap__node:hover .op-mindmap__label,
.op-mindmap__node:hover .op-mindmap__label--root {
  font-weight: 600;
}

.op-mindmap__node:focus-visible circle {
  stroke: #2563eb;
  stroke-width: 2.5;
}

/* Labels */
.op-mindmap__label {
  fill: #1e293b;
  pointer-events: none;
  font-family: system-ui, -apple-system, sans-serif;
}

.op-mindmap__label--root {
  fill: #ffffff;
  pointer-events: none;
  font-weight: 600;
  font-family: system-ui, -apple-system, sans-serif;
}

/* Plus button hidden by default, visible on link hover */
.op-mindmap__add-btn {
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.op-mindmap__link-group:hover .op-mindmap__add-btn {
  opacity: 1;
}

.op-mindmap__add-btn:hover circle {
  fill: url(#glass-bubble-hover);
}

/* Links */
.op-mindmap__link {
  transition: stroke 0.15s ease;
}

.op-mindmap__link-group:hover .op-mindmap__link {
  stroke: rgba(148, 163, 184, 0.8);
  stroke-width: 2.5;
}

/* Responsive */
@media (max-width: 640px) {
  .op-mindmap__svg {
    min-height: 300px;
  }
}
</style>
