import { z } from 'zod'

/**
 * Verfügbare Feldtypen für das Kontaktformular.
 */
export const ContactFieldTypeSchema = z.enum([
  'text',
  'email',
  'phone',
  'textarea',
  'select',
  'checkbox',
])

export type ContactFieldType = z.infer<typeof ContactFieldTypeSchema>

/**
 * Schema für ein einzelnes Formularfeld.
 */
export const ContactFieldSchema = z.object({
  name: z.string().min(1),
  type: ContactFieldTypeSchema,
  label: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  /** Optionen für Select-Felder */
  options: z.array(z.string()).optional(),
})

export type ContactField = z.infer<typeof ContactFieldSchema>

/**
 * Schema für die Block-Props des Kontaktformulars.
 */
export const ContactFormPropsSchema = z.object({
  fields: z.array(ContactFieldSchema).min(1),
  submitLabel: z.string().default('Absenden'),
  successMessage: z.string().default('Vielen Dank! Ihre Nachricht wurde gesendet.'),
  errorMessage: z.string().default('Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.'),
})

export type ContactFormProps = z.infer<typeof ContactFormPropsSchema>

/**
 * Schema für die E-Mail-Konfiguration (Server-Seite).
 */
export const ContactMailConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().default(587),
  secure: z.boolean().default(false),
  auth: z.object({
    user: z.string().min(1),
    pass: z.string().min(1),
  }),
  /** Empfänger der Benachrichtigungs-E-Mail */
  notifyTo: z.string().email(),
  /** Absender-Adresse */
  from: z.string().min(1),
  /** Betreff der Benachrichtigung */
  notifySubject: z.string().default('Neue Kontaktanfrage'),
  /** Bestätigungs-Mail an den Absender senden? */
  sendConfirmation: z.boolean().default(true),
  /** Betreff der Bestätigungs-Mail */
  confirmationSubject: z.string().default('Vielen Dank für Ihre Nachricht'),
})

export type ContactMailConfig = z.infer<typeof ContactMailConfigSchema>

/**
 * Schema für die eingehende Formular-Submission.
 * Validiert dynamisch basierend auf den konfigurierten Feldern.
 */
export const ContactSubmissionSchema = z.object({
  /** Formularfeld-Werte */
  data: z.record(z.string()),
  /** Honeypot-Feld (muss leer sein) */
  _hp: z.string().max(0, 'Spam detected').default(''),
})

export type ContactSubmission = z.infer<typeof ContactSubmissionSchema>

/**
 * Erstellt ein dynamisches Validierungsschema basierend auf den Felddefinitionen.
 */
export function createFieldValidationSchema(fields: ContactField[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny

    switch (field.type) {
      case 'email':
        fieldSchema = z.string().email('Ungültige E-Mail-Adresse')
        break
      case 'phone':
        fieldSchema = z.string().regex(/^[+\d\s\-()]{6,}$/, 'Ungültige Telefonnummer')
        break
      case 'checkbox':
        fieldSchema = z.union([z.literal('on'), z.literal('')])
        break
      default:
        fieldSchema = z.string()
    }

    if (field.required) {
      if (field.type === 'checkbox') {
        fieldSchema = z.literal('on', { errorMap: () => ({ message: 'Pflichtfeld' }) })
      } else {
        fieldSchema = (fieldSchema as z.ZodString).min(1, 'Pflichtfeld')
      }
    } else {
      fieldSchema = fieldSchema.optional().or(z.literal(''))
    }

    shape[field.name] = fieldSchema
  }

  return z.object(shape)
}
