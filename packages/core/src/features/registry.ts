import type { FeatureManifest, FeatureBlock, FeatureEditorPanel } from '@openpress/schemas'
import type { DiscoveredFeature } from './discover'

export interface RegisteredFeature {
  manifest: FeatureManifest
  packageDir: string
}

/**
 * A block entry enriched with its source feature name.
 * Used by the Component Picker to display available blocks.
 */
export interface ComponentPickerEntry {
  /** Block type identifier */
  type: string
  /** Human-readable label */
  label: string
  /** Optional description */
  description?: string
  /** Optional icon */
  icon?: string
  /** Optional category for grouping */
  category?: string
  /** Default props for new block instances */
  defaultProps?: Record<string, unknown>
  /** The feature that contributes this block */
  featureName: string
}

const featureStore = new Map<string, RegisteredFeature>()

/**
 * Registers a discovered feature in the runtime registry.
 */
export function registerFeature(discovered: DiscoveredFeature): void {
  featureStore.set(discovered.manifest.name, {
    manifest: discovered.manifest,
    packageDir: discovered.packageDir,
  })
}

/**
 * Bulk-registers multiple discovered features.
 */
export function registerFeatures(features: DiscoveredFeature[]): void {
  for (const feature of features) {
    registerFeature(feature)
  }
}

/**
 * Returns all registered features.
 */
export function getRegisteredFeatures(): RegisteredFeature[] {
  return Array.from(featureStore.values())
}

/**
 * Returns a specific registered feature by name.
 */
export function getFeature(name: string): RegisteredFeature | undefined {
  return featureStore.get(name)
}

/**
 * Returns true if a feature is registered.
 */
export function hasFeature(name: string): boolean {
  return featureStore.has(name)
}

/**
 * Returns all block components from all registered features,
 * enriched with their source feature name.
 * This is the data source for the Component Picker.
 */
export function getComponentPickerEntries(): ComponentPickerEntry[] {
  const entries: ComponentPickerEntry[] = []

  for (const { manifest } of featureStore.values()) {
    for (const block of manifest.blocks) {
      entries.push({
        type: block.type,
        label: block.label,
        description: block.description,
        icon: block.icon,
        category: block.category,
        defaultProps: block.defaultProps,
        featureName: manifest.name,
      })
    }
  }

  return entries
}

/**
 * Returns all editor panels from all registered features.
 */
export function getEditorPanels(): (FeatureEditorPanel & { featureName: string })[] {
  const panels: (FeatureEditorPanel & { featureName: string })[] = []

  for (const { manifest } of featureStore.values()) {
    for (const panel of manifest.editorPanels) {
      panels.push({ ...panel, featureName: manifest.name })
    }
  }

  return panels
}

/**
 * Clears the feature registry. Used in tests.
 */
export function clearFeatureRegistry(): void {
  featureStore.clear()
}
