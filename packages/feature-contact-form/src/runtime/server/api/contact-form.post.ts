import { defineEventHandler, readBody, createError, setResponseStatus } from 'h3'
import { createTransport } from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { ContactSubmissionSchema, ContactFormPropsSchema, createFieldValidationSchema } from '../../../schema'
import type { ContactField } from '../../../schema'

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (transporter) return transporter

  const config = useRuntimeConfig()
  const mail = config.opContactForm

  if (!mail.smtpHost || !mail.smtpUser || !mail.smtpPass) {
    throw createError({
      statusCode: 500,
      message: 'SMTP not configured. Set opContactForm options in nuxt.config.',
    })
  }

  transporter = createTransport({
    host: mail.smtpHost,
    port: mail.smtpPort,
    secure: mail.smtpSecure,
    auth: {
      user: mail.smtpUser,
      pass: mail.smtpPass,
    },
  })

  return transporter
}

function formatSubmissionAsHtml(data: Record<string, string>, fields: ContactField[]): string {
  const rows = fields
    .filter((f) => data[f.name] !== undefined && data[f.name] !== '')
    .map((f) => {
      const value = data[f.name]
      const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const labelEscaped = f.label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return `<tr><td style="padding:8px;font-weight:bold;vertical-align:top">${labelEscaped}</td><td style="padding:8px">${escaped}</td></tr>`
    })
    .join('')

  return `<table style="border-collapse:collapse;width:100%">${rows}</table>`
}

function formatSubmissionAsText(data: Record<string, string>, fields: ContactField[]): string {
  return fields
    .filter((f) => data[f.name] !== undefined && data[f.name] !== '')
    .map((f) => `${f.label}: ${data[f.name]}`)
    .join('\n')
}

/**
 * POST /api/_openpress/contact-form/submit
 *
 * Empfängt eine Kontaktformular-Submission, validiert die Daten
 * und sendet Benachrichtigungs- und Bestätigungs-E-Mails.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 1. Basis-Validierung (Honeypot + Datenstruktur)
  const submissionResult = ContactSubmissionSchema.safeParse(body)
  if (!submissionResult.success) {
    throw createError({
      statusCode: 422,
      message: 'Validation failed',
      data: submissionResult.error.issues,
    })
  }

  const { data: formData, _hp } = submissionResult.data

  // Honeypot-Check: wenn das Feld befüllt ist, wird es ein Bot sein
  if (_hp) {
    // Stille Ablehnung — kein Fehler, aber auch kein Versand
    setResponseStatus(event, 200)
    return { success: true }
  }

  // 2. Feld-Validierung (benötigt die Feld-Konfiguration aus dem Body)
  const propsResult = ContactFormPropsSchema.safeParse(body.props)
  if (!propsResult.success) {
    throw createError({
      statusCode: 422,
      message: 'Invalid form configuration',
      data: propsResult.error.issues,
    })
  }

  const { fields } = propsResult.data
  const fieldSchema = createFieldValidationSchema(fields)
  const fieldResult = fieldSchema.safeParse(formData)

  if (!fieldResult.success) {
    throw createError({
      statusCode: 422,
      message: 'Field validation failed',
      data: fieldResult.error.issues,
    })
  }

  // 3. E-Mail-Versand
  const config = useRuntimeConfig()
  const mail = config.opContactForm
  const transport = getTransporter()

  const htmlBody = formatSubmissionAsHtml(formData, fields)
  const textBody = formatSubmissionAsText(formData, fields)

  // Benachrichtigungs-E-Mail an den Betreiber
  await transport.sendMail({
    from: mail.from,
    to: mail.notifyTo,
    subject: 'Neue Kontaktanfrage',
    html: `<h2>Neue Kontaktanfrage</h2>${htmlBody}`,
    text: `Neue Kontaktanfrage\n\n${textBody}`,
  })

  // Bestätigungs-E-Mail an den Absender
  if (mail.sendConfirmation) {
    const emailField = fields.find((f) => f.type === 'email')
    const senderEmail = emailField ? formData[emailField.name] : undefined

    if (senderEmail) {
      await transport.sendMail({
        from: mail.from,
        to: senderEmail,
        subject: 'Vielen Dank für Ihre Nachricht',
        html: `<h2>Vielen Dank für Ihre Nachricht</h2><p>Wir haben Ihre Anfrage erhalten und werden uns so schnell wie möglich bei Ihnen melden.</p><hr/><h3>Ihre Angaben:</h3>${htmlBody}`,
        text: `Vielen Dank für Ihre Nachricht\n\nWir haben Ihre Anfrage erhalten und werden uns so schnell wie möglich bei Ihnen melden.\n\nIhre Angaben:\n${textBody}`,
      })
    }
  }

  setResponseStatus(event, 200)
  return { success: true }
})
