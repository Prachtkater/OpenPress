/**
 * Block-Registry: Mappt Block-Types auf Komponent-Definitionen.
 *
 * In einer Vue-Umgebung wären die Values Vue-Komponenten.
 * Hier verwenden wir ein generisches Record-Format, das von
 * der Vue-Schicht konsumiert wird.
 */

export interface BlockComponentDef {
  name: string
  render?: (block: { id: string; type: string; props: Record<string, unknown> }) => unknown
}

/** Fallback für unbekannte Block-Types */
export const OpBlockFallback: BlockComponentDef = {
  name: 'OpBlockFallback',
  render: (block) => ({
    type: 'fallback',
    blockType: block.type,
    blockId: block.id,
  }),
}

const blockRegistry = new Map<string, BlockComponentDef>()

/** Registriert eine Block-Komponente für einen Type */
export function registerBlock(type: string, component: BlockComponentDef): void {
  blockRegistry.set(type, component)
}

/** Löst einen Block-Type auf eine registrierte Komponente auf */
export function resolveBlockComponent(type: string): BlockComponentDef {
  return blockRegistry.get(type) ?? OpBlockFallback
}

/** Prüft ob ein Block-Type registriert ist */
export function hasBlock(type: string): boolean {
  return blockRegistry.has(type)
}

/** Gibt alle registrierten Block-Types zurück */
export function getRegisteredBlockTypes(): string[] {
  return Array.from(blockRegistry.keys())
}

/** Setzt die Block-Registry zurück (für Tests) */
export function clearBlockRegistry(): void {
  blockRegistry.clear()
}
