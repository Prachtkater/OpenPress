import { useAsyncData } from '#imports'
import type { FeatureBlock, FeatureEditorPanel } from '@openpress/schemas'

interface FeatureSummary {
  name: string
  label: string
  description?: string
  blocks: FeatureBlock[]
  editorPanels: FeatureEditorPanel[]
  editorRoutes: Array<{
    path: string
    label: string
    component: string
    icon?: string
  }>
}

interface FeaturesResponse {
  features: FeatureSummary[]
}

/**
 * Composable to access all registered OpenPress features.
 * Fetches from the features API endpoint — cached per request.
 */
export function useFeatures() {
  return useAsyncData('openpress:features', () =>
    $fetch<FeaturesResponse>('/api/_openpress/features')
  )
}

/**
 * Composable to access all available block types from all features.
 * This is the data source for the Component Picker.
 */
export function useComponentPicker() {
  return useAsyncData('openpress:component-picker', async () => {
    const response = await $fetch<FeaturesResponse>('/api/_openpress/features')

    return response.features.flatMap((feature) =>
      feature.blocks.map((block) => ({
        ...block,
        featureName: feature.name,
        featureLabel: feature.label,
      }))
    )
  })
}
