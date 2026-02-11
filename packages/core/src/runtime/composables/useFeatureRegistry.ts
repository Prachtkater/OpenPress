import { ref, computed } from 'vue'
import type { FeatureManifest } from '@openpress/schemas'

export interface RuntimeFeature {
  manifest: FeatureManifest
  packageDir: string
  /** Whether this feature is enabled (default: true) */
  enabled: boolean
}

/**
 * Internal reactive store for the feature registry.
 * Shared across all composable instances (module-level singleton).
 */
const featureMap = ref(new Map<string, RuntimeFeature>())
let _initialized = false

/**
 * Seeds the registry from runtimeConfig data (called once).
 */
function initFromConfig(
  configFeatures: Array<{ manifest: FeatureManifest; packageDir: string }>,
): void {
  if (_initialized) return
  _initialized = true

  const map = new Map<string, RuntimeFeature>()
  for (const f of configFeatures) {
    map.set(f.manifest.name, {
      manifest: f.manifest,
      packageDir: f.packageDir,
      enabled: true,
    })
  }
  featureMap.value = map
}

/**
 * Composable providing reactive, type-safe access to the OpenPress feature registry.
 *
 * Features are discovered at build time by the Nuxt module and injected via
 * runtimeConfig. This composable wraps them in a reactive API that supports
 * dynamic registration and per-feature enable/disable.
 *
 * @example
 * ```vue
 * <script setup>
 * const { getFeature, getAllFeatures, isFeatureEnabled } = useFeatureRegistry()
 *
 * const booking = getFeature('@openpress/feature-booking')
 * const allFeatures = getAllFeatures()
 * </script>
 * ```
 */
export function useFeatureRegistry() {
  // Lazy-init from runtimeConfig on first call (SSR + client)
  if (!_initialized) {
    try {
      // useRuntimeConfig is auto-imported by Nuxt — use dynamic access
      // to avoid hard dependency in tests
      const config = useRuntimeConfig()
      const configFeatures = (config as Record<string, unknown>)._openpressFeatures as
        | Array<{ manifest: FeatureManifest; packageDir: string }>
        | undefined
      if (configFeatures) {
        initFromConfig(configFeatures)
      }
    } catch {
      // Outside Nuxt context (tests, plain Vue) — skip init
    }
  }

  /** Get a single feature by name. Returns undefined if not found. */
  function getFeature(name: string): RuntimeFeature | undefined {
    return featureMap.value.get(name)
  }

  /** Reactive computed list of all registered features. */
  const allFeatures = computed(() => Array.from(featureMap.value.values()))

  /** Get all registered features (snapshot). */
  function getAllFeatures(): RuntimeFeature[] {
    return Array.from(featureMap.value.values())
  }

  /** Check if a feature is registered and enabled. */
  function isFeatureEnabled(name: string): boolean {
    const feature = featureMap.value.get(name)
    return feature?.enabled ?? false
  }

  /** Register a feature dynamically at runtime. */
  function registerFeature(manifest: FeatureManifest, packageDir = ''): void {
    const next = new Map(featureMap.value)
    next.set(manifest.name, { manifest, packageDir, enabled: true })
    featureMap.value = next
  }

  /** Enable or disable a registered feature. No-op if feature not found. */
  function setFeatureEnabled(name: string, enabled: boolean): void {
    const feature = featureMap.value.get(name)
    if (!feature) return

    const next = new Map(featureMap.value)
    next.set(name, { ...feature, enabled })
    featureMap.value = next
  }

  /** Number of registered features (reactive). */
  const featureCount = computed(() => featureMap.value.size)

  return {
    getFeature,
    getAllFeatures,
    allFeatures,
    isFeatureEnabled,
    registerFeature,
    setFeatureEnabled,
    featureCount,
  }
}

/**
 * Reset the feature registry. For testing only.
 */
export function _resetFeatureRegistry(): void {
  featureMap.value = new Map()
  _initialized = false
}

/**
 * Seed the feature registry from config data. For testing or manual init.
 */
export function _initFeatureRegistry(
  features: Array<{ manifest: FeatureManifest; packageDir: string }>,
): void {
  _initialized = false
  initFromConfig(features)
}
