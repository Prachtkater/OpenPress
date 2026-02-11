import { describe, it, expect, beforeEach } from 'bun:test'
import {
  registerFeature,
  registerFeatures,
  getRegisteredFeatures,
  getFeature,
  hasFeature,
  getComponentPickerEntries,
  getEditorPanels,
  getEditorRoutes,
  clearFeatureRegistry,
} from './registry'
import type { DiscoveredFeature } from './discover'
import type { FeatureManifest } from '@openpress/schemas'

function makeFeature(overrides: Partial<FeatureManifest> & Pick<FeatureManifest, 'name' | 'label'>): DiscoveredFeature {
  return {
    manifest: {
      blocks: [],
      editorPanels: [],
      editorRoutes: [],
      ...overrides,
    },
    packageDir: `/fake/path/${overrides.name}`,
    manifestPath: `/fake/path/${overrides.name}/openpress.feature.json`,
  }
}

describe('Feature Registry', () => {
  beforeEach(() => {
    clearFeatureRegistry()
  })

  describe('registerFeature / getFeature / hasFeature', () => {
    it('registers and retrieves a feature', () => {
      const feature = makeFeature({
        name: '@openpress/feature-test',
        label: 'Test Feature',
      })

      registerFeature(feature)

      expect(hasFeature('@openpress/feature-test')).toBe(true)
      expect(getFeature('@openpress/feature-test')).toBeDefined()
      expect(getFeature('@openpress/feature-test')!.manifest.label).toBe('Test Feature')
    })

    it('returns undefined for unregistered features', () => {
      expect(getFeature('@openpress/nonexistent')).toBeUndefined()
      expect(hasFeature('@openpress/nonexistent')).toBe(false)
    })

    it('overwrites existing feature with same name', () => {
      registerFeature(makeFeature({
        name: '@openpress/feature-test',
        label: 'Version 1',
      }))
      registerFeature(makeFeature({
        name: '@openpress/feature-test',
        label: 'Version 2',
      }))

      expect(getFeature('@openpress/feature-test')!.manifest.label).toBe('Version 2')
      expect(getRegisteredFeatures()).toHaveLength(1)
    })
  })

  describe('registerFeatures', () => {
    it('bulk-registers multiple features', () => {
      const features = [
        makeFeature({ name: '@openpress/feature-a', label: 'Feature A' }),
        makeFeature({ name: '@openpress/feature-b', label: 'Feature B' }),
      ]

      registerFeatures(features)

      expect(getRegisteredFeatures()).toHaveLength(2)
      expect(hasFeature('@openpress/feature-a')).toBe(true)
      expect(hasFeature('@openpress/feature-b')).toBe(true)
    })
  })

  describe('getRegisteredFeatures', () => {
    it('returns empty array when no features registered', () => {
      expect(getRegisteredFeatures()).toEqual([])
    })

    it('returns all registered features', () => {
      registerFeatures([
        makeFeature({ name: '@openpress/feature-a', label: 'A' }),
        makeFeature({ name: '@openpress/feature-b', label: 'B' }),
        makeFeature({ name: '@openpress/feature-c', label: 'C' }),
      ])

      const features = getRegisteredFeatures()
      expect(features).toHaveLength(3)
    })
  })

  describe('getComponentPickerEntries', () => {
    it('returns empty array when no features have blocks', () => {
      registerFeature(makeFeature({
        name: '@openpress/feature-empty',
        label: 'Empty',
      }))

      expect(getComponentPickerEntries()).toEqual([])
    })

    it('returns blocks from all features with feature name', () => {
      registerFeatures([
        makeFeature({
          name: '@openpress/feature-forms',
          label: 'Forms',
          blocks: [
            { type: 'contact-form', label: 'Contact Form', category: 'Forms' },
            { type: 'newsletter', label: 'Newsletter Signup', category: 'Forms' },
          ],
        }),
        makeFeature({
          name: '@openpress/feature-booking',
          label: 'Booking',
          blocks: [
            { type: 'booking-calendar', label: 'Booking Calendar', category: 'Scheduling' },
          ],
        }),
      ])

      const entries = getComponentPickerEntries()
      expect(entries).toHaveLength(3)

      expect(entries[0]).toEqual({
        type: 'contact-form',
        label: 'Contact Form',
        description: undefined,
        icon: undefined,
        category: 'Forms',
        defaultProps: undefined,
        featureName: '@openpress/feature-forms',
      })

      expect(entries[2].featureName).toBe('@openpress/feature-booking')
    })

    it('includes defaultProps when defined', () => {
      registerFeature(makeFeature({
        name: '@openpress/feature-test',
        label: 'Test',
        blocks: [
          {
            type: 'test-block',
            label: 'Test Block',
            defaultProps: { color: 'blue', size: 'large' },
          },
        ],
      }))

      const entries = getComponentPickerEntries()
      expect(entries[0].defaultProps).toEqual({ color: 'blue', size: 'large' })
    })
  })

  describe('getEditorPanels', () => {
    it('returns empty array when no features have panels', () => {
      registerFeature(makeFeature({
        name: '@openpress/feature-empty',
        label: 'Empty',
      }))

      expect(getEditorPanels()).toEqual([])
    })

    it('returns panels from all features', () => {
      registerFeatures([
        makeFeature({
          name: '@openpress/feature-forms',
          label: 'Forms',
          editorPanels: [
            { id: 'form-settings', label: 'Form Settings', component: './FormSettings.vue' },
          ],
        }),
        makeFeature({
          name: '@openpress/feature-booking',
          label: 'Booking',
          editorPanels: [
            { id: 'booking-settings', label: 'Booking Settings', component: './BookingSettings.vue' },
          ],
        }),
      ])

      const panels = getEditorPanels()
      expect(panels).toHaveLength(2)
      expect(panels[0].featureName).toBe('@openpress/feature-forms')
      expect(panels[1].featureName).toBe('@openpress/feature-booking')
    })
  })

  describe('getEditorRoutes', () => {
    it('returns empty array when no features have routes', () => {
      registerFeature(makeFeature({
        name: '@openpress/feature-empty',
        label: 'Empty',
      }))

      expect(getEditorRoutes()).toEqual([])
    })

    it('returns routes from all features', () => {
      registerFeatures([
        makeFeature({
          name: '@openpress/feature-booking',
          label: 'Booking',
          editorRoutes: [
            { path: '/_edit/bookings', label: 'Bookings', component: './BookingsDashboard.vue', icon: 'mdi:calendar' },
          ],
        }),
        makeFeature({
          name: '@openpress/feature-media',
          label: 'Media',
          editorRoutes: [
            { path: '/_edit/media', label: 'Media', component: './MediaDashboard.vue' },
          ],
        }),
      ])

      const routes = getEditorRoutes()
      expect(routes).toHaveLength(2)
      expect(routes[0].featureName).toBe('@openpress/feature-booking')
      expect(routes[0].path).toBe('/_edit/bookings')
      expect(routes[1].featureName).toBe('@openpress/feature-media')
    })
  })

  describe('clearFeatureRegistry', () => {
    it('removes all registered features', () => {
      registerFeatures([
        makeFeature({ name: '@openpress/feature-a', label: 'A' }),
        makeFeature({ name: '@openpress/feature-b', label: 'B' }),
      ])

      expect(getRegisteredFeatures()).toHaveLength(2)

      clearFeatureRegistry()

      expect(getRegisteredFeatures()).toHaveLength(0)
      expect(hasFeature('@openpress/feature-a')).toBe(false)
    })
  })
})
