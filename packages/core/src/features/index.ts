export {
  discoverFeatures,
  readManifest,
  resolvePackageDir,
  extractModuleNames,
  type DiscoveredFeature,
  type DiscoveryError,
  type DiscoveryResult,
} from './discover'

export {
  registerFeature,
  registerFeatures,
  getRegisteredFeatures,
  getFeature,
  hasFeature,
  getComponentPickerEntries,
  getEditorPanels,
  clearFeatureRegistry,
  type RegisteredFeature,
  type ComponentPickerEntry,
} from './registry'
