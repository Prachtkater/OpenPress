import { describe, it, expect } from 'bun:test'
import { FeatureManifestSchema, FeatureBlockSchema, FeatureEditorPanelSchema } from './feature-manifest'

describe('FeatureBlockSchema', () => {
  it('validates a minimal block', () => {
    const result = FeatureBlockSchema.safeParse({
      type: 'contact-form',
      label: 'Contact Form',
    })
    expect(result.success).toBe(true)
  })

  it('validates a full block', () => {
    const result = FeatureBlockSchema.safeParse({
      type: 'booking-calendar',
      label: 'Booking Calendar',
      description: 'Interactive booking widget',
      icon: 'mdi:calendar',
      category: 'Scheduling',
      defaultProps: { duration: 30, color: 'blue' },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.defaultProps).toEqual({ duration: 30, color: 'blue' })
    }
  })

  it('rejects empty type', () => {
    const result = FeatureBlockSchema.safeParse({ type: '', label: 'X' })
    expect(result.success).toBe(false)
  })

  it('rejects empty label', () => {
    const result = FeatureBlockSchema.safeParse({ type: 'x', label: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    const result = FeatureBlockSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('FeatureEditorPanelSchema', () => {
  it('validates a panel', () => {
    const result = FeatureEditorPanelSchema.safeParse({
      id: 'form-settings',
      label: 'Form Settings',
      component: './FormSettings.vue',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing component', () => {
    const result = FeatureEditorPanelSchema.safeParse({
      id: 'form-settings',
      label: 'Form Settings',
    })
    expect(result.success).toBe(false)
  })
})

describe('FeatureManifestSchema', () => {
  it('validates a minimal manifest', () => {
    const result = FeatureManifestSchema.safeParse({
      name: '@openpress/feature-test',
      label: 'Test Feature',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.blocks).toEqual([])
      expect(result.data.editorPanels).toEqual([])
      expect(result.data.editorRoutes).toEqual([])
    }
  })

  it('validates a full manifest', () => {
    const result = FeatureManifestSchema.safeParse({
      name: '@openpress/feature-contact-form',
      label: 'Contact Form',
      version: '1.0.0',
      description: 'Adds a customizable contact form block',
      blocks: [
        {
          type: 'contact-form',
          label: 'Contact Form',
          description: 'Drag-and-drop contact form',
          icon: 'mdi:form-select',
          category: 'Forms',
          defaultProps: { fields: ['name', 'email', 'message'] },
        },
      ],
      editorPanels: [
        {
          id: 'contact-form-settings',
          label: 'Form Settings',
          component: './panels/FormSettings.vue',
          icon: 'mdi:cog',
        },
      ],
      editorRoutes: [
        {
          path: '/_edit/form-submissions',
          label: 'Submissions',
          component: './pages/Submissions.vue',
          icon: 'mdi:inbox',
        },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.blocks).toHaveLength(1)
      expect(result.data.editorPanels).toHaveLength(1)
      expect(result.data.editorRoutes).toHaveLength(1)
    }
  })

  it('rejects manifest without name', () => {
    const result = FeatureManifestSchema.safeParse({
      label: 'Missing Name',
    })
    expect(result.success).toBe(false)
  })

  it('rejects manifest without label', () => {
    const result = FeatureManifestSchema.safeParse({
      name: '@openpress/feature-test',
    })
    expect(result.success).toBe(false)
  })

  it('rejects manifest with invalid blocks', () => {
    const result = FeatureManifestSchema.safeParse({
      name: '@openpress/feature-test',
      label: 'Test',
      blocks: [{ invalid: true }],
    })
    expect(result.success).toBe(false)
  })

  it('accepts manifest with empty arrays', () => {
    const result = FeatureManifestSchema.safeParse({
      name: '@openpress/feature-test',
      label: 'Test',
      blocks: [],
      editorPanels: [],
      editorRoutes: [],
    })
    expect(result.success).toBe(true)
  })
})
