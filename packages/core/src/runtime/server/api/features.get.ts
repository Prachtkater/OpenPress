import { defineEventHandler } from 'h3'

/**
 * GET /api/_openpress/features
 *
 * Returns all discovered feature manifests with their component picker entries.
 * Used by the editor UI to populate the Component Picker.
 */
export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  const features = config._openpressFeatures ?? []

  return {
    features: features.map((f) => ({
      name: f.manifest.name,
      label: f.manifest.label,
      description: f.manifest.description,
      blocks: f.manifest.blocks,
      editorPanels: f.manifest.editorPanels,
      editorRoutes: f.manifest.editorRoutes,
    })),
  }
})
