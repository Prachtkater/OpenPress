export {
  discoverFeatures,
  readManifest,
  resolvePackageDir,
  extractModuleNames,
  scanWorkspaceFeatures,
  isOpenPressFeature,
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
  getEditorRoutes,
  clearFeatureRegistry,
  type RegisteredFeature,
  type ComponentPickerEntry,
} from './registry'
