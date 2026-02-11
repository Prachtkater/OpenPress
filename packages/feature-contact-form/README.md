# @openpress/feature-contact-form

Konfigurierbares Kontaktformular-Feature für OpenPress mit Zod-Validierung, Honeypot-Spamschutz und NodeMailer E-Mail-Versand.

## Inhaltsverzeichnis

- [Installation & Konfiguration](#installation--konfiguration)
- [SMTP / NodeMailer Integration](#smtp--nodemailer-integration)
- [API-Endpunkt](#api-endpunkt)
- [Komponente: OpContactForm](#komponente-opcontactform)
- [Composable: useContactForm](#composable-usecontactform)
- [Zod-Schemas](#zod-schemas)
- [Theme-Integration & Styling](#theme-integration--styling)
- [Sicherheit](#sicherheit)
- [Feature-Manifest](#feature-manifest)
- [Exports](#exports)
- [Tests](#tests)

---

## Installation & Konfiguration

Das Paket wird als Nuxt-Modul in der `nuxt.config.ts` registriert:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@openpress/feature-contact-form/module'],

  opContactForm: {
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: 'noreply@example.com',
    smtpPass: process.env.SMTP_PASS,
    notifyTo: 'admin@example.com',
    from: 'noreply@example.com',
    sendConfirmation: true,
  },
})
```

### Modul-Optionen (`ContactFormModuleOptions`)

| Option             | Typ       | Default | Beschreibung                                    |
| ------------------ | --------- | ------- | ----------------------------------------------- |
| `smtpHost`         | `string`  | `''`    | SMTP-Server Hostname                            |
| `smtpPort`         | `number`  | `587`   | SMTP-Port                                       |
| `smtpSecure`       | `boolean` | `false` | TLS verwenden (`true` für Port 465)             |
| `smtpUser`         | `string`  | `''`    | SMTP-Authentifizierung: Benutzername             |
| `smtpPass`         | `string`  | `''`    | SMTP-Authentifizierung: Passwort                 |
| `notifyTo`         | `string`  | `''`    | Empfänger-Adresse für Kontaktanfragen            |
| `from`             | `string`  | `''`    | Absender-Adresse für ausgehende E-Mails          |
| `sendConfirmation` | `boolean` | `true`  | Bestätigungs-Mail an den Absender senden         |

Das Modul registriert automatisch:

1. **Komponenten** — `OpContactForm` wird global mit `Op`-Prefix verfügbar
2. **Composables** — `useContactForm` wird per Auto-Import bereitgestellt
3. **Server-API** — `POST /api/_openpress/contact-form/submit`
4. **Runtime Config** — SMTP-Daten werden in `runtimeConfig.opContactForm` injiziert

---

## SMTP / NodeMailer Integration

Der E-Mail-Versand nutzt [NodeMailer](https://nodemailer.com/) (`nodemailer ^6.9.0`).

### Transporter-Konfiguration

Der SMTP-Transporter wird serverseitig als Singleton erstellt und beim ersten Request initialisiert. Die Konfiguration wird aus `useRuntimeConfig().opContactForm` gelesen:

```ts
createTransport({
  host: mail.smtpHost,
  port: mail.smtpPort,     // default: 587
  secure: mail.smtpSecure, // default: false (STARTTLS)
  auth: {
    user: mail.smtpUser,
    pass: mail.smtpPass,
  },
})
```

Falls `smtpHost`, `smtpUser` oder `smtpPass` nicht konfiguriert sind, wird ein `500`-Fehler mit der Meldung `"SMTP not configured"` zurückgegeben.

### E-Mail-Typen

**1. Benachrichtigungs-E-Mail** (an den Betreiber)

Wird bei jeder validen Submission an `notifyTo` gesendet. Enthält alle ausgefüllten Formularfelder als HTML-Tabelle und als Plain-Text-Fallback.

**2. Bestätigungs-E-Mail** (an den Absender)

Wird optional (`sendConfirmation: true`) an die E-Mail-Adresse des Absenders gesendet. Die Adresse wird automatisch aus dem ersten Feld mit `type: 'email'` extrahiert. Enthält eine Dankes-Nachricht und eine Kopie der eingegebenen Daten.

### Konfiguration via `ContactMailConfigSchema`

Für die server-seitige Validierung steht ein erweitertes Schema zur Verfügung:

```ts
ContactMailConfigSchema.parse({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: { user: 'user', pass: 'pass' },
  notifyTo: 'admin@example.com',
  from: 'noreply@example.com',
  notifySubject: 'Neue Kontaktanfrage',       // default
  sendConfirmation: true,                       // default
  confirmationSubject: 'Vielen Dank für Ihre Nachricht', // default
})
```

---

## API-Endpunkt

### `POST /api/_openpress/contact-form/submit`

Empfängt eine Kontaktformular-Submission, validiert die Daten und löst den E-Mail-Versand aus.

#### Request Body

```ts
{
  data: Record<string, string>  // Formularfeld-Werte (key = Feldname)
  _hp: string                    // Honeypot-Feld (muss leer sein)
  props: ContactFormProps        // Feld-Konfiguration zur Server-Validierung
}
```

#### Verarbeitungs-Pipeline

1. **Struktur-Validierung** — `ContactSubmissionSchema` prüft `data` (Record) und `_hp` (max. 0 Zeichen)
2. **Honeypot-Check** — Wenn `_hp` befüllt ist: stille Ablehnung (Status `200`, kein Versand)
3. **Props-Validierung** — `ContactFormPropsSchema` prüft die mitgesendete Feld-Konfiguration
4. **Feld-Validierung** — `createFieldValidationSchema(fields)` validiert jeden Wert gegen seine Felddefinition
5. **E-Mail-Versand** — Benachrichtigung an Betreiber + optionale Bestätigung an Absender

#### Responses

| Status | Bedingung                        | Body                                        |
| ------ | -------------------------------- | ------------------------------------------- |
| `200`  | Erfolg / stille Honeypot-Ablehnung | `{ success: true }`                        |
| `422`  | Validierungsfehler               | `{ message: string, data: ZodIssue[] }`     |
| `500`  | SMTP nicht konfiguriert          | `{ message: "SMTP not configured..." }`     |

#### Beispiel: cURL

```bash
curl -X POST http://localhost:3000/api/_openpress/contact-form/submit \
  -H 'Content-Type: application/json' \
  -d '{
    "data": { "name": "Max", "email": "max@example.com", "message": "Hallo!" },
    "_hp": "",
    "props": {
      "fields": [
        { "name": "name", "type": "text", "label": "Name", "required": true },
        { "name": "email", "type": "email", "label": "E-Mail", "required": true },
        { "name": "message", "type": "textarea", "label": "Nachricht", "required": true }
      ]
    }
  }'
```

---

## Komponente: OpContactForm

Vue-Komponente für die Formular-Darstellung. Wird vom Modul global registriert.

### Props

```ts
defineProps<{
  block: {
    id: string                    // Block-Instanz-ID (ULID)
    type: string                  // 'contact-form'
    props: Record<string, unknown> // Block-Konfiguration
  }
}>()
```

Die `block.props` werden intern mit `ContactFormPropsSchema.parse()` validiert und mit Defaults aufgefüllt.

### Verwendung im Template

```vue
<template>
  <OpContactForm :block="{
    id: '01H1234567890ABCDEFGH',
    type: 'contact-form',
    props: {
      fields: [
        { name: 'name', type: 'text', label: 'Name', required: true },
        { name: 'email', type: 'email', label: 'E-Mail', required: true },
        { name: 'phone', type: 'phone', label: 'Telefon', placeholder: '+49...' },
        { name: 'category', type: 'select', label: 'Betreff',
          options: ['Support', 'Vertrieb', 'Sonstiges'], required: true },
        { name: 'message', type: 'textarea', label: 'Nachricht', required: true },
        { name: 'privacy', type: 'checkbox', label: 'Datenschutz',
          placeholder: 'Ich akzeptiere die Datenschutzerklärung', required: true },
      ],
      submitLabel: 'Nachricht senden',
      successMessage: 'Vielen Dank! Wir melden uns bei Ihnen.',
      errorMessage: 'Fehler beim Senden. Bitte versuchen Sie es erneut.',
    },
  }" />
</template>
```

### Unterstützte Feldtypen

| Typ        | HTML-Element             | Validierung                                 |
| ---------- | ------------------------ | ------------------------------------------- |
| `text`     | `<input type="text">`    | Min. 1 Zeichen (wenn `required`)            |
| `email`    | `<input type="email">`   | RFC-konformes E-Mail-Format                 |
| `phone`    | `<input type="tel">`     | Regex: `^[+\d\s\-()]{6,}$`                 |
| `textarea` | `<textarea rows="4">`    | Min. 1 Zeichen (wenn `required`)            |
| `select`   | `<select>` mit Optionen  | Min. 1 Zeichen (wenn `required`)            |
| `checkbox` | `<input type="checkbox">` | Muss `'on'` sein (wenn `required`)          |

### Formular-Lifecycle

1. Felder werden aus `block.props.fields` gerendert
2. Bei `@blur` wird das jeweilige Feld client-seitig validiert
3. Bei Submit: alle Felder validieren, dann `POST` an API
4. Bei Erfolg: Formular wird durch `successMessage` ersetzt
5. Bei Fehler: `submitError` wird unter dem Formular angezeigt

---

## Composable: useContactForm

Kapselt die gesamte Formular-Logik: State-Management, Validierung und Submission.

### Signatur

```ts
function useContactForm(props: ContactFormProps): UseContactFormReturn
```

### Rückgabewerte

```ts
interface UseContactFormReturn {
  formData: Record<string, string>     // Reaktive Formular-Daten
  errors: Record<string, string>       // Feld-spezifische Fehlermeldungen
  submitting: Ref<boolean>             // true während des API-Calls
  submitted: Ref<boolean>              // true nach erfolgreichem Versand
  submitError: Ref<string>             // Globale Fehlermeldung
  isValid: Ref<boolean>                // Computed: alle Felder valide?
  validateField: (name: string) => boolean  // Einzelnes Feld validieren
  validateAll: () => boolean                // Alle Felder validieren
  submit: () => Promise<void>               // Formular absenden
  reset: () => void                         // State zurücksetzen
}
```

### Beispiel: Custom-Nutzung ohne OpContactForm

```vue
<script setup lang="ts">
import { useContactForm } from '@openpress/feature-contact-form'
import type { ContactFormProps } from '@openpress/feature-contact-form'

const props: ContactFormProps = {
  fields: [
    { name: 'email', type: 'email', label: 'E-Mail', required: true },
    { name: 'message', type: 'textarea', label: 'Nachricht', required: true },
  ],
  submitLabel: 'Senden',
  successMessage: 'Danke!',
  errorMessage: 'Fehler!',
}

const { formData, errors, submitting, submitted, submitError, submit } =
  useContactForm(props)
</script>

<template>
  <div v-if="submitted">{{ props.successMessage }}</div>
  <form v-else @submit.prevent="submit">
    <input v-model="formData.email" type="email" />
    <p v-if="errors.email">{{ errors.email }}</p>

    <textarea v-model="formData.message" />
    <p v-if="errors.message">{{ errors.message }}</p>

    <p v-if="submitError">{{ submitError }}</p>
    <button :disabled="submitting">{{ props.submitLabel }}</button>
  </form>
</template>
```

---

## Zod-Schemas

Alle Schemas sind die Single Source of Truth. TypeScript-Typen werden via `z.infer<>` abgeleitet.

### ContactFieldTypeSchema

```ts
z.enum(['text', 'email', 'phone', 'textarea', 'select', 'checkbox'])
```

### ContactFieldSchema

```ts
z.object({
  name: z.string().min(1),             // Eindeutiger Feldname
  type: ContactFieldTypeSchema,        // Feldtyp
  label: z.string().min(1),            // Anzeige-Label
  placeholder: z.string().optional(),  // Platzhalter-Text
  required: z.boolean().default(false),// Pflichtfeld?
  options: z.array(z.string()).optional(), // Optionen für Select-Felder
})
```

### ContactFormPropsSchema

```ts
z.object({
  fields: z.array(ContactFieldSchema).min(1),
  submitLabel: z.string().default('Absenden'),
  successMessage: z.string().default('Vielen Dank! Ihre Nachricht wurde gesendet.'),
  errorMessage: z.string().default('Beim Senden ist ein Fehler aufgetreten...'),
})
```

### ContactSubmissionSchema

```ts
z.object({
  data: z.record(z.string()),                     // Feld-Werte
  _hp: z.string().max(0, 'Spam detected').default(''), // Honeypot
})
```

### createFieldValidationSchema(fields)

Erstellt dynamisch ein Zod-Schema basierend auf der Feld-Konfiguration:

- **`email`** — `z.string().email('Ungültige E-Mail-Adresse')`
- **`phone`** — `z.string().regex(/^[+\d\s\-()]{6,}$/, 'Ungültige Telefonnummer')`
- **`checkbox`** (required) — `z.literal('on', { errorMap: () => ({ message: 'Pflichtfeld' }) })`
- **`text` / `textarea` / `select`** (required) — `z.string().min(1, 'Pflichtfeld')`
- Optionale Felder: `.optional().or(z.literal(''))`

---

## Theme-Integration & Styling

`OpContactForm` ist vollständig theme-agnostisch. Alle CSS-Klassen werden vom aktiven Theme über `useOpBlockClasses('contact-form')` aus `@openpress/ui` aufgelöst.

### CSS-Slots

Das Formular definiert 17 Style-Slots, die jedes Theme implementieren muss:

| Slot              | Beschreibung                           |
| ----------------- | -------------------------------------- |
| `root`            | Container-Element                      |
| `form`            | `<form>`-Wrapper                       |
| `fieldGroup`      | Gruppe: Label + Input + Fehler         |
| `label`           | Feld-Label                             |
| `required`        | Pflichtfeld-Indikator (`*`)            |
| `input`           | Text-, E-Mail- und Telefon-Inputs      |
| `inputError`      | Input im Fehler-Zustand                |
| `textarea`        | Textarea-Element                       |
| `select`          | Select-Dropdown                        |
| `checkboxWrapper` | Container für Checkbox + Label         |
| `checkbox`        | Checkbox-Input                         |
| `checkboxLabel`   | Label neben der Checkbox               |
| `error`           | Feld-spezifische Fehlermeldung         |
| `submitError`     | Globale Fehlermeldung (unter Formular) |
| `button`          | Submit-Button                          |
| `spinner`         | Lade-Indikator im Button               |
| `success`         | Erfolgs-Nachricht nach dem Versand     |

### Beispiel: Tailwind Plus Theme

```ts
// @openpress/theme-tailwind-plus
{
  root: 'w-full max-w-2xl mx-auto',
  form: 'flex flex-col gap-6',
  input: 'w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-800',
  button: 'bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700',
  success: 'bg-green-50 text-green-800 p-6 rounded-lg',
  // ...
}
```

### Beispiel: Material Expressive Theme

```ts
// @openpress/theme-material-expressive
{
  input: '...border-color: var(--md-sys-color-outline); color: var(--md-sys-color-on-surface)...',
  button: '...background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); rounded-full...',
  error: '...color: var(--md-sys-color-error)...',
  // ...
}
```

### Klassen-Override

`useOpBlockClasses` unterstützt drei Prioritätsstufen:

```ts
const classes = useOpBlockClasses(
  'contact-form',
  {},                           // 1. Variant (niedrigste Priorität)
  { button: 'bg-green-600' },   // 2. Config-Override
  { input: 'rounded-none' },    // 3. UI-Override (höchste Priorität)
)
```

---

## Sicherheit

### Implementiert

**Honeypot-Spamschutz**

Ein verstecktes Feld (`_hp`) wird im Formular gerendert, aber visuell und für Screenreader verborgen:

- `position: absolute; left: -9999px; top: -9999px` (außerhalb des Viewports)
- `aria-hidden="true"` (für Assistive Technologies unsichtbar)
- `tabindex="-1"` (nicht per Tab erreichbar)
- `autocomplete="off"` (kein Browser-Autofill)

**Verhalten:** Bots, die alle Felder befüllen, setzen auch `_hp`. Der Server erkennt dies und gibt `200 OK` zurück, versendet aber keine E-Mail (stille Ablehnung). Der Bot erhält keine Hinweise darauf, dass seine Submission verworfen wurde.

**Doppelte Validierung (Client + Server)**

- **Client-seitig:** `useContactForm` validiert alle Felder via Zod vor dem Absenden. Fehlermeldungen werden sofort beim `@blur`-Event angezeigt.
- **Server-seitig:** Der API-Endpunkt re-validiert alle Daten unabhängig vom Client. Dies schützt gegen manipulierte Requests.

**XSS-Schutz in E-Mails**

Alle Formularwerte werden vor der Einbettung in HTML-E-Mails escaped:

```ts
value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
```

**TypeScript Strict Mode**

Alle Schemas, Composables und Server-Handler sind strikt typisiert. Keine `any`-Types.

### Geplant / Erweiterbar

| Feature               | Status    | Beschreibung                                      |
| --------------------- | --------- | ------------------------------------------------- |
| Rate Limiting          | Geplant   | Request-Begrenzung pro IP/Zeitfenster              |
| CAPTCHA-Integration    | Geplant   | Optionales reCAPTCHA / hCaptcha                    |
| CSRF-Token             | Geplant   | Token-basierter Schutz gegen Cross-Site Requests   |
| E-Mail-Verifizierung   | Geplant   | Double-Opt-In für Bestätigungs-Mails               |

---

## Feature-Manifest

Die Datei `openpress.feature.json` registriert das Paket im OpenPress Feature-Discovery-System:

```json
{
  "name": "@openpress/feature-contact-form",
  "label": "Kontaktformular",
  "version": "0.0.1",
  "blocks": [{
    "type": "contact-form",
    "label": "Kontaktformular",
    "icon": "mdi:email-outline",
    "category": "Formulare",
    "defaultProps": {
      "fields": [
        { "name": "name", "type": "text", "label": "Name", "required": true },
        { "name": "email", "type": "email", "label": "E-Mail", "required": true },
        { "name": "message", "type": "textarea", "label": "Nachricht", "required": true }
      ],
      "submitLabel": "Absenden"
    }
  }],
  "editorPanels": [{
    "id": "contact-form-settings",
    "label": "Formular-Einstellungen",
    "component": "./src/runtime/components/ContactFormSettings.vue",
    "icon": "mdi:cog"
  }]
}
```

---

## Exports

```ts
// src/index.ts

// Schemas
export {
  ContactFieldTypeSchema,
  ContactFieldSchema,
  ContactFormPropsSchema,
  ContactMailConfigSchema,
  ContactSubmissionSchema,
  createFieldValidationSchema,
  type ContactFieldType,
  type ContactField,
  type ContactFormProps,
  type ContactMailConfig,
  type ContactSubmission,
} from './schema'

// Nuxt Module
export { default } from './module'
export type { ContactFormModuleOptions } from './module'
```

---

## Tests

Das Paket enthält drei Test-Dateien:

### `schema.test.ts` (24 Tests)

- `ContactFieldTypeSchema` — valide/invalide Feldtypen
- `ContactFieldSchema` — Feld-Parsing, Defaults, Validierung
- `ContactFormPropsSchema` — Props-Parsing, Default-Messages
- `ContactMailConfigSchema` — Mail-Konfiguration, E-Mail-Validierung
- `ContactSubmissionSchema` — Submissions, Honeypot-Erkennung
- `createFieldValidationSchema` — Dynamische Validierung pro Feldtyp (E-Mail-Format, Telefon-Regex, Checkbox, Pflichtfelder)

### `module.test.ts` (2 Suites)

- Feature-Manifest gegen `FeatureManifestSchema` validieren
- Modul-Exports vollständig vorhanden

### `theme.test.ts` (4 Suites, 18 Tests)

- Tailwind Plus: alle 17 Slots vorhanden, korrekte Klassen
- M3 Expressive: CSS-Variablen, `rounded-full` Button
- `useOpBlockClasses` Integration: Theme-Switching, Config- und UI-Overrides

```bash
bun test packages/feature-contact-form
```

---

## Paketstruktur

```
packages/feature-contact-form/
├── openpress.feature.json          # Feature-Manifest
├── package.json
├── README.md
└── src/
    ├── index.ts                    # Public Exports
    ├── module.ts                   # Nuxt Module Definition
    ├── schema.ts                   # Zod Schemas & Typen
    ├── schema.test.ts              # Schema-Tests
    ├── module.test.ts              # Modul-Tests
    ├── theme.test.ts               # Theme-Integrations-Tests
    └── runtime/
        ├── components/
        │   └── OpContactForm.vue   # Vue-Komponente
        ├── composables/
        │   └── useContactForm.ts   # Formular-Logik
        └── server/
            └── api/
                └── contact-form.post.ts  # API-Handler
```
