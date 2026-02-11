import { describe, it, expect, beforeEach } from 'bun:test'
import type { FeatureManifest } from '@openpress/schemas'
import {
  useFeatureRegistry,
  _resetFeatureRegistry,
  _initFeatureRegistry,
} from './useFeatureRegistry'

function makeManifest(
  overrides: Partial<FeatureManifest> & Pick<FeatureManifest, 'name' | 'label'>,
): FeatureManifest {
  return {
    blocks: [],
    editorPanels: [],
    editorRoutes: [],
    ...overrides,
  }
}

describe('useFeatureRegistry', () => {
  beforeEach(() => {
    _resetFeatureRegistry()
  })

  describe('initial state', () => {
    it('returns empty registry when no features are initialized', () => {
      const { getAllFeatures, featureCount } = useFeatureRegistry()
      expect(getAllFeatures()).toEqual([])
      expect(featureCount.value).toBe(0)
    })
  })

  describe('_initFeatureRegistry', () => {
    it('seeds registry from config data', () => {
      _initFeatureRegistry([
        {
          manifest: makeManifest({ name: '@openpress/feature-booking', label: 'Booking' }),
          packageDir: '/packages/feature-booking',
        },
        {
          manifest: makeManifest({ name: '@openpress/feature-forms', label: 'Forms' }),
          packageDir: '/packages/feature-forms',
        },
      ])

      const { getAllFeatures, featureCount } = useFeatureRegistry()
      expect(getAllFeatures()).toHaveLength(2)
      expect(featureCount.value).toBe(2)
    })

    it('sets all seeded features as enabled by default', () => {
      _initFeatureRegistry([
        {
          manifest: makeManifest({ name: '@openpress/feature-test', label: 'Test' }),
          packageDir: '/packages/feature-test',
        },
      ])

      const { isFeatureEnabled } = useFeatureRegistry()
      expect(isFeatureEnabled('@openpress/feature-test')).toBe(true)
    })
  })

  describe('getFeature', () => {
    it('returns a registered feature by name', () => {
      _initFeatureRegistry([
        {
          manifest: makeManifest({
            name: '@openpress/feature-booking',
            label: 'Booking & Appointments',
            version: '0.0.1',
          }),
          packageDir: '/packages/feature-booking',
        },
      ])

      const { getFeature } = useFeatureRegistry()
      const feature = getFeature('@openpress/feature-booking')

      expect(feature).toBeDefined()
      expect(feature!.manifest.name).toBe('@openpress/feature-booking')
      expect(feature!.manifest.label).toBe('Booking & Appointments')
      expect(feature!.packageDir).toBe('/packages/feature-booking')
      expect(feature!.enabled).toBe(true)
    })

    it('returns undefined for unregistered features', () => {
      const { getFeature } = useFeatureRegistry()
      expect(getFeature('@openpress/feature-nonexistent')).toBeUndefined()
    })
  })

  describe('getAllFeatures', () => {
    it('returns all registered features', () => {
      _initFeatureRegistry([
        {
          manifest: makeManifest({ name: '@openpress/feature-a', label: 'A' }),
          packageDir: '/a',
        },
        {
          manifest: makeManifest({ name: '@openpress/feature-b', label: 'B' }),
          packageDir: '/b',
        },
        {
          manifest: makeManifest({ name: '@openpress/feature-c', label: 'C' }),
          packageDir: '/c',
        },
      ])

      const { getAllFeatures } = useFeatureRegistry()
      const features = getAllFeatures()
      expect(features).toHaveLength(3)

      const names = features.map((f) => f.manifest.name)
      expect(names).toContain('@openpress/feature-a')
      expect(names).toContain('@openpress/feature-b')
      expect(names).toContain('@openpress/feature-c')
    })
  })

  describe('isFeatureEnabled', () => {
    it('returns true for registered enabled features', () => {
      _initFeatureRegistry([
        {
          manifest: makeManifest({ name: '@openpress/feature-test', label: 'Test' }),
          packageDir: '/test',
        },
      ])

      const { isFeatureEnabled } = useFeatureRegistry()
      expect(isFeatureEnabled('@openpress/feature-test')).toBe(true)
    })

    it('returns false for unregistered features', () => {
      const { isFeatureEnabled } = useFeatureRegistry()
      expect(isFeatureEnabled('@openpress/feature-missing')).toBe(false)
    })

    it('returns false for disabled features', () => {
      _initFeatureRegistry([
        {
          manifest: makeManifest({ name: '@openpress/feature-test', label: 'Test' }),
          packageDir: '/test',
        },
      ])

      const { setFeatureEnabled, isFeatureEnabled } = useFeatureRegistry()
      setFeatureEnabled('@openpress/feature-test', false)
      expect(isFeatureEnabled('@openpress/feature-test')).toBe(false)
    })
  })

  describe('registerFeature', () => {
    it('adds a new feature dynamically', () => {
      const { registerFeature, getFeature, featureCount } = useFeatureRegistry()

      registerFeature(
        makeManifest({ name: '@openpress/feature-dynamic', label: 'Dynamic Feature' }),
        '/dynamic',
      )

      expect(featureCount.value).toBe(1)
      const feature = getFeature('@openpress/feature-dynamic')
      expect(feature).toBeDefined()
      expect(feature!.manifest.label).toBe('Dynamic Feature')
      expect(feature!.enabled).toBe(true)
    })

    it('overwrites an existing feature with the same name', () => {
      _initFeatureRegistry([
        {
          manifest: makeManifest({ name: '@openpress/feature-test', label: 'Version 1' }),
          packageDir: '/v1',
        },
      ])

      const { registerFeature, getFeature, featureCount } = useFeatureRegistry()

      registerFeature(
        makeManifest({ name: '@openpress/feature-test', label: 'Version 2' }),
        '/v2',
      )

      expect(featureCount.value).toBe(1)
      expect(getFeature('@openpress/feature-test')!.manifest.label).toBe('Version 2')
    })

    it('defaults packageDir to empty string', () => {
      const { registerFeature, getFeature } = useFeatureRegistry()

      registerFeature(
        makeManifest({ name: '@openpress/feature-minimal', label: 'Minimal' }),
      )

      expect(getFeature('@openpress/feature-minimal')!.packageDir).toBe('')
    })
  })

  describe('setFeatureEnabled', () => {
    it('disables a registered feature', () => {
      _initFeatureRegistry([
        {
          manifest: makeManifest({ name: '@openpress/feature-test', label: 'Test' }),
          packageDir: '/test',
        },
      ])

      const { setFeatureEnabled, getFeature } = useFeatureRegistry()
      setFeatureEnabled('@openpress/feature-test', false)

      expect(getFeature('@openpress/feature-test')!.enabled).toBe(false)
    })

    it('re-enables a disabled feature', () => {
      _initFeatureRegistry([
        {
          manifest: makeManifest({ name: '@openpress/feature-test', label: 'Test' }),
          packageDir: '/test',
        },
      ])

      const { setFeatureEnabled, isFeatureEnabled } = useFeatureRegistry()
      setFeatureEnabled('@openpress/feature-test', false)
      expect(isFeatureEnabled('@openpress/feature-test')).toBe(false)

      setFeatureEnabled('@openpress/feature-test', true)
      expect(isFeatureEnabled('@openpress/feature-test')).toBe(true)
    })

    it('is a no-op for unregistered features', () => {
      const { setFeatureEnabled, featureCount } = useFeatureRegistry()
      setFeatureEnabled('@openpress/feature-nonexistent', false)
      expect(featureCount.value).toBe(0)
    })
  })

  describe('allFeatures computed', () => {
    it('reflects dynamically registered features', () => {
      const { registerFeature, allFeatures } = useFeatureRegistry()

      expect(allFeatures.value).toHaveLength(0)

      registerFeature(
        makeManifest({ name: '@openpress/feature-x', label: 'X' }),
      )

      expect(allFeatures.value).toHaveLength(1)
      expect(allFeatures.value[0].manifest.name).toBe('@openpress/feature-x')
    })
  })

  describe('shared state across instances', () => {
    it('shares registry state between multiple useFeatureRegistry calls', () => {
      const registry1 = useFeatureRegistry()
      const registry2 = useFeatureRegistry()

      registry1.registerFeature(
        makeManifest({ name: '@openpress/feature-shared', label: 'Shared' }),
      )

      expect(registry2.getFeature('@openpress/feature-shared')).toBeDefined()
      expect(registry2.featureCount.value).toBe(1)
    })
  })
})
