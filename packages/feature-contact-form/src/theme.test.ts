import { describe, test, expect, beforeEach } from 'bun:test'
import {
  resolveComponentClasses,
  provide,
  clearContext,
  useOpBlockClasses,
  OP_THEME_KEY,
} from '@openpress/ui'
import type { OpThemeConfig } from '@openpress/ui'
import { theme as tailwindTheme } from '@openpress/theme-tailwind-plus'
import { contactForm as tailwindContactForm } from '@openpress/theme-tailwind-plus'
import { contactForm as m3ContactForm } from '../../theme-material-expressive/src/components/blocks/contact-form'
import { theme as m3Theme } from '../../theme-material-expressive/src/index'

// ─── Tailwind Plus: Contact Form ──────────────────────────────

describe('Tailwind Plus: Contact Form Block', () => {
  test('hat alle erwarteten Slots', () => {
    const expectedSlots = [
      'root', 'form', 'fieldGroup', 'label', 'required',
      'input', 'inputError', 'textarea', 'select',
      'checkboxWrapper', 'checkbox', 'checkboxLabel',
      'error', 'submitError', 'button', 'spinner', 'success',
    ]

    for (const slot of expectedSlots) {
      expect(tailwindContactForm.slots[slot]).toBeDefined()
    }
  })

  test('input Slot enthält Border und Rounded', () => {
    expect(tailwindContactForm.slots.input).toContain('rounded-lg')
    expect(tailwindContactForm.slots.input).toContain('border')
    expect(tailwindContactForm.slots.input).toContain('border-gray-300')
  })

  test('input Slot enthält Focus-Klassen', () => {
    expect(tailwindContactForm.slots.input).toContain('focus:border-primary-500')
    expect(tailwindContactForm.slots.input).toContain('focus:ring-2')
  })

  test('input Slot enthält Dark-Mode Klassen', () => {
    expect(tailwindContactForm.slots.input).toContain('dark:border-gray-600')
    expect(tailwindContactForm.slots.input).toContain('dark:bg-gray-800')
  })

  test('inputError Slot enthält Fehler-Farben', () => {
    expect(tailwindContactForm.slots.inputError).toContain('border-red-500')
  })

  test('button Slot enthält Primary-Background', () => {
    expect(tailwindContactForm.slots.button).toContain('bg-primary-600')
    expect(tailwindContactForm.slots.button).toContain('text-white')
  })

  test('success Slot enthält Green-Farben', () => {
    expect(tailwindContactForm.slots.success).toContain('bg-green-50')
    expect(tailwindContactForm.slots.success).toContain('text-green-800')
  })

  test('Klassen werden korrekt aufgelöst', () => {
    const result = resolveComponentClasses(tailwindContactForm, {})

    expect(result.root).toContain('w-full')
    expect(result.form).toContain('flex')
    expect(result.form).toContain('flex-col')
    expect(result.form).toContain('gap-6')
    expect(result.button).toContain('bg-primary-600')
  })
})

// ─── Material Expressive: Contact Form ────────────────────────

describe('M3 Expressive: Contact Form Block', () => {
  test('hat alle erwarteten Slots', () => {
    const expectedSlots = [
      'root', 'form', 'fieldGroup', 'label', 'required',
      'input', 'inputError', 'textarea', 'select',
      'checkboxWrapper', 'checkbox', 'checkboxLabel',
      'error', 'submitError', 'button', 'spinner', 'success',
    ]

    for (const slot of expectedSlots) {
      expect(m3ContactForm.slots[slot]).toBeDefined()
    }
  })

  test('input Slot verwendet M3 CSS-Variablen', () => {
    expect(m3ContactForm.slots.input).toContain('var(--md-sys-color-outline)')
    expect(m3ContactForm.slots.input).toContain('var(--md-sys-color-on-surface)')
  })

  test('button Slot verwendet M3 Primary Color', () => {
    expect(m3ContactForm.slots.button).toContain('var(--md-sys-color-primary)')
    expect(m3ContactForm.slots.button).toContain('var(--md-sys-color-on-primary)')
  })

  test('button Slot hat rounded-full (M3 Expressive)', () => {
    expect(m3ContactForm.slots.button).toContain('rounded-full')
  })

  test('error Slot verwendet M3 Error Color', () => {
    expect(m3ContactForm.slots.error).toContain('var(--md-sys-color-error)')
  })

  test('Klassen werden korrekt aufgelöst', () => {
    const result = resolveComponentClasses(m3ContactForm, {})

    expect(result.root).toContain('w-full')
    expect(result.form).toContain('flex')
    expect(result.button).toContain('rounded-full')
  })
})

// ─── Theme Context Integration ────────────────────────────────

describe('useOpBlockClasses Integration', () => {
  beforeEach(() => {
    clearContext()
  })

  test('Tailwind Plus: useOpBlockClasses löst contact-form auf', () => {
    provide(OP_THEME_KEY, Object.freeze(tailwindTheme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses('contact-form')

    expect(classes.root).toContain('w-full')
    expect(classes.button).toContain('bg-primary-600')
    expect(classes.input).toContain('border-gray-300')
  })

  test('M3 Expressive: useOpBlockClasses löst contact-form auf', () => {
    provide(OP_THEME_KEY, Object.freeze(m3Theme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses('contact-form')

    expect(classes.root).toContain('w-full')
    expect(classes.button).toContain('rounded-full')
    expect(classes.input).toContain('var(--md-sys-color-outline)')
  })

  test('Config-Override überschreibt Button-Klassen', () => {
    provide(OP_THEME_KEY, Object.freeze(tailwindTheme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses(
      'contact-form',
      {},
      { button: 'bg-green-600' },
    )

    expect(classes.button).toContain('bg-green-600')
    expect(classes.button).not.toContain('bg-primary-600')
  })

  test('UI-Override hat höchste Priorität', () => {
    provide(OP_THEME_KEY, Object.freeze(tailwindTheme) as Readonly<OpThemeConfig>)

    const classes = useOpBlockClasses(
      'contact-form',
      {},
      undefined,
      { input: 'rounded-none border-2' },
    )

    expect(classes.input).toContain('rounded-none')
    expect(classes.input).not.toContain('rounded-lg')
    expect(classes.input).toContain('border-2')
  })
})
