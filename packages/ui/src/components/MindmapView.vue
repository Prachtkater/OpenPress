<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as d3 from 'd3';

interface MindmapNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'page' | 'add';
  x?: number;
  y?: number;
}

interface MindmapLink extends d3.SimulationLinkDatum<MindmapNode> {
  source: string | MindmapNode;
  target: string | MindmapNode;
}

const props = defineProps<{
  data: {
    id: string;
    label: string;
    children?: { id: string; label: string }[];
  };
}>();

const emit = defineEmits<{
  (e: 'add-page', parentId: string): void;
  (e: 'select-page', id: string): void;
}>();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

let simulation: d3.Simulation<MindmapNode, MindmapLink> | null = null;

const initMindmap = () => {
  if (!svgRef.value || !containerRef.value) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight || 600;

  const nodes: MindmapNode[] = [];
  const links: MindmapLink[] = [];

  // Root node (Homepage)
  const root: MindmapNode = { id: props.data.id, label: props.data.label, type: 'page', x: width / 2, y: height / 2 };
  nodes.push(root);

  // Add children
  if (props.data.children) {
    props.data.children.forEach((child) => {
      const childNode: MindmapNode = { id: child.id, label: child.label, type: 'page' };
      nodes.push(childNode);
      links.push({ source: root.id, target: childNode.id });

      // Add "New Page" trigger for each subpage
      const addNode: MindmapNode = { id: `add-${child.id}`, label: '+', type: 'add' };
      nodes.push(addNode);
      links.push({ source: childNode.id, target: addNode.id });
    });
  }

  // Add "New Page" trigger for root
  const rootAddNode: MindmapNode = { id: `add-${root.id}`, label: '+', type: 'add' };
  nodes.push(rootAddNode);
  links.push({ source: root.id, target: rootAddNode.id });

  const svg = d3.select(svgRef.value)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height]);

  // Clear existing content
  svg.selectAll('*').remove();

  const g = svg.append('g');

  // Zoom behavior
  svg.call(d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    }));

  simulation = d3.forceSimulation<MindmapNode>(nodes)
    .force('link', d3.forceLink<MindmapNode, MindmapLink>(links).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-500))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(60));

  const link = g.append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke-width', 2);

  const node = g.append('g')
    .selectAll<SVGGElement, MindmapNode>('g')
    .data(nodes)
    .join('g')
    .call(d3.drag<SVGGElement, MindmapNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  // Circles for nodes
  node.append('circle')
    .attr('r', d => d.type === 'page' ? 40 : 20)
    .attr('fill', d => d.type === 'page' ? '#4f46e5' : '#10b981')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .on('click', (event, d) => {
      if (d.type === 'page') {
        emit('select-page', d.id);
      } else {
        const parentId = d.id.replace('add-', '');
        emit('add-page', parentId);
      }
    });

  // Labels
  node.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .attr('fill', '#fff')
    .attr('font-size', d => d.type === 'page' ? '12px' : '18px')
    .attr('font-weight', 'bold')
    .attr('pointer-events', 'none')
    .text(d => d.label);

  simulation.on('tick', () => {
    link
      .attr('x1', d => (d.source as MindmapNode).x!)
      .attr('y1', d => (d.source as MindmapNode).y!)
      .attr('x2', d => (d.target as MindmapNode).x!)
      .attr('y2', d => (d.target as MindmapNode).y!);

    node
      .attr('transform', d => `translate(${d.x},${d.y})`);
  });

  function dragstarted(event: any) {
    if (!event.active) simulation?.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event: any) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event: any) {
    if (!event.active) simulation?.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
};

onMounted(() => {
  initMindmap();
  window.addEventListener('resize', initMindmap);
});

onUnmounted(() => {
  window.removeEventListener('resize', initMindmap);
  simulation?.stop();
});

watch(() => props.data, initMindmap, { deep: true });
</script>

<template>
  <div ref="containerRef" class="w-full h-full min-h-[600px] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
    <svg ref="svgRef" class="w-full h-full"></svg>
  </div>
</template>

<style scoped>
svg {
  cursor: grab;
}
svg:active {
  cursor: grabbing;
}
</style>
