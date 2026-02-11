import { describe, test, expect } from 'bun:test'
import {
  ContactFieldTypeSchema,
  ContactFieldSchema,
  ContactFormPropsSchema,
  ContactMailConfigSchema,
  ContactSubmissionSchema,
  createFieldValidationSchema,
} from './schema'
import type { ContactField } from './schema'

// ─── ContactFieldTypeSchema ───────────────────────────────────

describe('ContactFieldTypeSchema', () => {
  test('akzeptiert alle gültigen Feldtypen', () => {
    const types = ['text', 'email', 'phone', 'textarea', 'select', 'checkbox'] as const
    for (const type of types) {
      expect(ContactFieldTypeSchema.parse(type)).toBe(type)
    }
  })

  test('lehnt ungültige Feldtypen ab', () => {
    expect(ContactFieldTypeSchema.safeParse('date').success).toBe(false)
    expect(ContactFieldTypeSchema.safeParse('number').success).toBe(false)
    expect(ContactFieldTypeSchema.safeParse('').success).toBe(false)
  })
})

// ─── ContactFieldSchema ───────────────────────────────────────

describe('ContactFieldSchema', () => {
  test('parst ein gültiges Feld', () => {
    const result = ContactFieldSchema.parse({
      name: 'email',
      type: 'email',
      label: 'E-Mail',
      required: true,
    })

    expect(result.name).toBe('email')
    expect(result.type).toBe('email')
    expect(result.label).toBe('E-Mail')
    expect(result.required).toBe(true)
  })

  test('setzt required auf false als Default', () => {
    const result = ContactFieldSchema.parse({
      name: 'name',
      type: 'text',
      label: 'Name',
    })

    expect(result.required).toBe(false)
  })

  test('akzeptiert optionale Felder', () => {
    const result = ContactFieldSchema.parse({
      name: 'country',
      type: 'select',
      label: 'Land',
      placeholder: 'Bitte wählen',
      options: ['Deutschland', 'Österreich', 'Schweiz'],
    })

    expect(result.placeholder).toBe('Bitte wählen')
    expect(result.options).toEqual(['Deutschland', 'Österreich', 'Schweiz'])
  })

  test('lehnt leere name ab', () => {
    const result = ContactFieldSchema.safeParse({
      name: '',
      type: 'text',
      label: 'Name',
    })
    expect(result.success).toBe(false)
  })

  test('lehnt leere label ab', () => {
    const result = ContactFieldSchema.safeParse({
      name: 'name',
      type: 'text',
      label: '',
    })
    expect(result.success).toBe(false)
  })
})

// ─── ContactFormPropsSchema ───────────────────────────────────

describe('ContactFormPropsSchema', () => {
  test('parst gültige Props mit Defaults', () => {
    const result = ContactFormPropsSchema.parse({
      fields: [
        { name: 'name', type: 'text', label: 'Name', required: true },
      ],
    })

    expect(result.submitLabel).toBe('Absenden')
    expect(result.successMessage).toContain('Vielen Dank')
    expect(result.errorMessage).toContain('Fehler')
  })

  test('überschreibt Defaults', () => {
    const result = ContactFormPropsSchema.parse({
      fields: [
        { name: 'name', type: 'text', label: 'Name' },
      ],
      submitLabel: 'Send',
      successMessage: 'Thank you!',
      errorMessage: 'Error!',
    })

    expect(result.submitLabel).toBe('Send')
    expect(result.successMessage).toBe('Thank you!')
    expect(result.errorMessage).toBe('Error!')
  })

  test('lehnt leere fields ab', () => {
    const result = ContactFormPropsSchema.safeParse({ fields: [] })
    expect(result.success).toBe(false)
  })
})

// ─── ContactMailConfigSchema ──────────────────────────────────

describe('ContactMailConfigSchema', () => {
  test('parst gültige Mail-Konfiguration', () => {
    const result = ContactMailConfigSchema.parse({
      host: 'smtp.example.com',
      auth: { user: 'user@example.com', pass: 'secret' },
      notifyTo: 'admin@example.com',
      from: 'noreply@example.com',
    })

    expect(result.port).toBe(587)
    expect(result.secure).toBe(false)
    expect(result.sendConfirmation).toBe(true)
    expect(result.notifySubject).toBe('Neue Kontaktanfrage')
    expect(result.confirmationSubject).toBe('Vielen Dank für Ihre Nachricht')
  })

  test('lehnt ungültige notifyTo E-Mail ab', () => {
    const result = ContactMailConfigSchema.safeParse({
      host: 'smtp.example.com',
      auth: { user: 'user', pass: 'pass' },
      notifyTo: 'not-an-email',
      from: 'noreply@example.com',
    })
    expect(result.success).toBe(false)
  })
})

// ─── ContactSubmissionSchema ──────────────────────────────────

describe('ContactSubmissionSchema', () => {
  test('parst gültige Submission', () => {
    const result = ContactSubmissionSchema.parse({
      data: { name: 'Max', email: 'max@example.com', message: 'Hallo!' },
    })

    expect(result.data.name).toBe('Max')
    expect(result._hp).toBe('')
  })

  test('lehnt befülltes Honeypot ab', () => {
    const result = ContactSubmissionSchema.safeParse({
      data: { name: 'Bot' },
      _hp: 'spam content',
    })
    expect(result.success).toBe(false)
  })

  test('akzeptiert leeres Honeypot', () => {
    const result = ContactSubmissionSchema.safeParse({
      data: { name: 'Max' },
      _hp: '',
    })
    expect(result.success).toBe(true)
  })
})

// ─── createFieldValidationSchema ──────────────────────────────

describe('createFieldValidationSchema', () => {
  test('validiert required Text-Feld', () => {
    const fields: ContactField[] = [
      { name: 'name', type: 'text', label: 'Name', required: true },
    ]
    const schema = createFieldValidationSchema(fields)

    expect(schema.safeParse({ name: 'Max' }).success).toBe(true)
    expect(schema.safeParse({ name: '' }).success).toBe(false)
  })

  test('validiert optionales Text-Feld', () => {
    const fields: ContactField[] = [
      { name: 'company', type: 'text', label: 'Firma', required: false },
    ]
    const schema = createFieldValidationSchema(fields)

    expect(schema.safeParse({ company: '' }).success).toBe(true)
    expect(schema.safeParse({ company: 'OpenPress' }).success).toBe(true)
    expect(schema.safeParse({}).success).toBe(true)
  })

  test('validiert E-Mail-Feld', () => {
    const fields: ContactField[] = [
      { name: 'email', type: 'email', label: 'E-Mail', required: true },
    ]
    const schema = createFieldValidationSchema(fields)

    expect(schema.safeParse({ email: 'max@example.com' }).success).toBe(true)
    expect(schema.safeParse({ email: 'not-an-email' }).success).toBe(false)
    expect(schema.safeParse({ email: '' }).success).toBe(false)
  })

  test('validiert Telefon-Feld', () => {
    const fields: ContactField[] = [
      { name: 'phone', type: 'phone', label: 'Telefon', required: true },
    ]
    const schema = createFieldValidationSchema(fields)

    expect(schema.safeParse({ phone: '+49 170 1234567' }).success).toBe(true)
    expect(schema.safeParse({ phone: '(030) 123-456' }).success).toBe(true)
    expect(schema.safeParse({ phone: 'abc' }).success).toBe(false)
  })

  test('validiert Checkbox-Feld (required)', () => {
    const fields: ContactField[] = [
      { name: 'terms', type: 'checkbox', label: 'AGB', required: true },
    ]
    const schema = createFieldValidationSchema(fields)

    expect(schema.safeParse({ terms: 'on' }).success).toBe(true)
    expect(schema.safeParse({ terms: '' }).success).toBe(false)
  })

  test('validiert mehrere Felder gleichzeitig', () => {
    const fields: ContactField[] = [
      { name: 'name', type: 'text', label: 'Name', required: true },
      { name: 'email', type: 'email', label: 'E-Mail', required: true },
      { name: 'message', type: 'textarea', label: 'Nachricht', required: true },
      { name: 'company', type: 'text', label: 'Firma', required: false },
    ]
    const schema = createFieldValidationSchema(fields)

    const valid = schema.safeParse({
      name: 'Max',
      email: 'max@example.com',
      message: 'Hallo!',
    })
    expect(valid.success).toBe(true)

    const invalid = schema.safeParse({
      name: 'Max',
      email: 'not-valid',
      message: '',
    })
    expect(invalid.success).toBe(false)
  })

  test('gibt korrekte Fehlermeldungen', () => {
    const fields: ContactField[] = [
      { name: 'name', type: 'text', label: 'Name', required: true },
      { name: 'email', type: 'email', label: 'E-Mail', required: true },
    ]
    const schema = createFieldValidationSchema(fields)

    const result = schema.safeParse({ name: '', email: 'bad' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issues = result.error.issues
      expect(issues.some((i) => i.path[0] === 'name' && i.message === 'Pflichtfeld')).toBe(true)
      expect(issues.some((i) => i.path[0] === 'email')).toBe(true)
    }
  })
})
