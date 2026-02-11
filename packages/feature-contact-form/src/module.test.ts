import { describe, test, expect } from 'bun:test'
import { FeatureManifestSchema } from '@openpress/schemas'

// ─── Feature Manifest ─────────────────────────────────────────

describe('Feature Manifest', () => {
  test('openpress.feature.json ist ein gültiges Manifest', async () => {
    const file = Bun.file(new URL('../openpress.feature.json', import.meta.url).pathname)
    const json = await file.json()
    const result = FeatureManifestSchema.safeParse(json)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('@openpress/feature-contact-form')
      expect(result.data.label).toBe('Kontaktformular')
      expect(result.data.blocks).toHaveLength(1)
      expect(result.data.blocks[0].type).toBe('contact-form')
      expect(result.data.editorPanels).toHaveLength(1)
    }
  })

  test('Block hat defaultProps mit fields', async () => {
    const file = Bun.file(new URL('../openpress.feature.json', import.meta.url).pathname)
    const json = await file.json()
    const result = FeatureManifestSchema.parse(json)
    const block = result.blocks[0]

    expect(block.defaultProps).toBeDefined()
    expect(block.defaultProps!.fields).toBeDefined()
    expect(Array.isArray(block.defaultProps!.fields)).toBe(true)
  })
})

// ─── Module Exports ───────────────────────────────────────────

describe('Module Exports', () => {
  test('exportiert Schemas', async () => {
    const {
      ContactFieldTypeSchema,
      ContactFieldSchema,
      ContactFormPropsSchema,
      ContactMailConfigSchema,
      ContactSubmissionSchema,
      createFieldValidationSchema,
    } = await import('./index')

    expect(ContactFieldTypeSchema).toBeDefined()
    expect(ContactFieldSchema).toBeDefined()
    expect(ContactFormPropsSchema).toBeDefined()
    expect(ContactMailConfigSchema).toBeDefined()
    expect(ContactSubmissionSchema).toBeDefined()
    expect(typeof createFieldValidationSchema).toBe('function')
  })
})
