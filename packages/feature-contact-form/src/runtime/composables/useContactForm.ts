import { ref, reactive, computed } from 'vue'
import type { Ref } from 'vue'
import { createFieldValidationSchema } from '../../schema'
import type { ContactField, ContactFormProps } from '../../schema'

export interface UseContactFormReturn {
  /** Reaktive Formular-Daten */
  formData: Record<string, string>
  /** Feld-Fehlermeldungen */
  errors: Record<string, string>
  /** Ob gerade gesendet wird */
  submitting: Ref<boolean>
  /** Ob das Formular erfolgreich gesendet wurde */
  submitted: Ref<boolean>
  /** Globale Fehlermeldung */
  submitError: Ref<string>
  /** Ob das Formular gültig ist */
  isValid: Ref<boolean>
  /** Einzelnes Feld validieren */
  validateField: (name: string) => boolean
  /** Alle Felder validieren */
  validateAll: () => boolean
  /** Formular absenden */
  submit: () => Promise<void>
  /** Formular zurücksetzen */
  reset: () => void
}

/**
 * Composable für die Kontaktformular-Logik.
 *
 * Verwaltet Formular-State, Client-Validierung und Submission.
 */
export function useContactForm(props: ContactFormProps): UseContactFormReturn {
  const { fields } = props

  // Initiale Werte
  const initialData: Record<string, string> = {}
  for (const field of fields) {
    initialData[field.name] = ''
  }

  const formData = reactive<Record<string, string>>({ ...initialData })
  const errors = reactive<Record<string, string>>({})
  const submitting = ref(false)
  const submitted = ref(false)
  const submitError = ref('')

  const fieldSchema = createFieldValidationSchema(fields)

  const isValid = computed(() => {
    const result = fieldSchema.safeParse(formData)
    return result.success
  })

  function validateField(name: string): boolean {
    const field = fields.find((f) => f.name === name)
    if (!field) return true

    // Erstelle ein Teil-Schema nur für dieses Feld
    const singleFieldSchema = createFieldValidationSchema([field])
    const result = singleFieldSchema.safeParse({ [name]: formData[name] })

    if (result.success) {
      delete errors[name]
      return true
    }

    const issue = result.error.issues[0]
    if (issue) {
      errors[name] = issue.message
    }
    return false
  }

  function validateAll(): boolean {
    let valid = true
    for (const field of fields) {
      if (!validateField(field.name)) {
        valid = false
      }
    }
    return valid
  }

  async function submit(): Promise<void> {
    submitError.value = ''

    if (!validateAll()) return

    submitting.value = true

    try {
      const response = await fetch('/api/_openpress/contact-form/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...formData },
          _hp: '',
          props,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message ?? props.errorMessage)
      }

      submitted.value = true
    } catch (err) {
      submitError.value = err instanceof Error ? err.message : props.errorMessage
    } finally {
      submitting.value = false
    }
  }

  function reset(): void {
    for (const key of Object.keys(formData)) {
      formData[key] = ''
    }
    for (const key of Object.keys(errors)) {
      delete errors[key]
    }
    submitted.value = false
    submitError.value = ''
  }

  return {
    formData,
    errors,
    submitting,
    submitted,
    submitError,
    isValid,
    validateField,
    validateAll,
    submit,
    reset,
  }
}
