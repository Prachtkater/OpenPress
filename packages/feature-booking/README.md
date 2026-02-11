# @openpress/feature-booking

Termin- und Buchungssystem fuer OpenPress. Verwaltet Verfuegbarkeiten, Zeitfenster und Buchungen mit Git-backed JSON Storage.

## Inhaltsverzeichnis

- [Installation](#installation)
- [Nuxt Modul-Konfiguration](#nuxt-modul-konfiguration)
- [Architektur](#architektur)
- [JSON-Datenstrukturen](#json-datenstrukturen)
- [BookingEngine API](#bookingengine-api)
- [BookingStorage API](#bookingstorage-api)
- [OpBooking Komponente](#opbooking-komponente)
- [Dashboard-Integration](#dashboard-integration)
- [Feature Manifest](#feature-manifest)
- [Fehlerbehandlung](#fehlerbehandlung)
- [Tests](#tests)

## Installation

Das Paket wird als Workspace-Dependency im Monorepo referenziert:

```json
{
  "dependencies": {
    "@openpress/feature-booking": "workspace:*"
  }
}
```

## Nuxt Modul-Konfiguration

Das Modul registriert sich unter dem Config-Key `openpressBooking`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@openpress/feature-booking"],
  openpressBooking: {
    bookingSubdir: "bookings", // Standard: "bookings"
  },
});
```

| Option          | Typ      | Standard     | Beschreibung                                          |
| --------------- | -------- | ------------ | ----------------------------------------------------- |
| `bookingSubdir` | `string` | `"bookings"` | Unterverzeichnis fuer Buchungsdaten relativ zu Content |

Das Modul registriert automatisch alle Komponenten im `runtime/components/` Verzeichnis mit dem Praefix `Op` (global verfuegbar).

## Architektur

Das Paket folgt einer strikten Drei-Schichten-Architektur:

```
┌─────────────────────────────────────────────┐
│  Vue Components (Theme-agnostisch)          │
│  OpBooking · BookingSettingsPanel            │
│  BookingsDashboard                          │
├─────────────────────────────────────────────┤
│  BookingEngine (Pure Logic, kein I/O)       │
│  Slot-Generierung · Validierung             │
├─────────────────────────────────────────────┤
│  BookingStorage (Git-backed JSON)           │
│  Bun.file() / Bun.write() · Zod-Validierung│
├─────────────────────────────────────────────┤
│  Zod Schemas (Single Source of Truth)       │
│  TimeSlot · BookingConfig · Booking · Store │
└─────────────────────────────────────────────┘
```

**Dateien:**

| Datei                     | Verantwortung                                |
| ------------------------- | -------------------------------------------- |
| `src/schemas.ts`          | Zod-Schemas und abgeleitete TypeScript-Typen |
| `src/booking-engine.ts`   | Reine Scheduling-Logik ohne Seiteneffekte    |
| `src/booking-storage.ts`  | CRUD-Operationen auf JSON-Dateien            |
| `src/module.ts`           | Nuxt-Modul-Registrierung                     |
| `src/index.ts`            | Public API Exports                           |

## JSON-Datenstrukturen

Alle Daten werden als JSON-Dateien im Verzeichnis `content/bookings/` gespeichert. Die Verzeichnisstruktur:

```
content/bookings/
├── configs/
│   ├── 01HYX1A2B3C4D5E6F7G8H9.json   # BookingConfig
│   └── 01HYX2B3C4D5E6F7G8H9J0.json   # BookingConfig
└── bookings/
    ├── 01HYX1A2B3C4D5E6F7G8H9.json   # BookingStore (Buchungen fuer Config 1)
    └── 01HYX2B3C4D5E6F7G8H9J0.json   # BookingStore (Buchungen fuer Config 2)
```

### TimeSlot

Ein Zeitfenster mit Start- und Endzeit im 24h-Format.

```json
{
  "start": "09:00",
  "end": "10:00"
}
```

| Feld    | Typ      | Format  | Beschreibung           |
| ------- | -------- | ------- | ---------------------- |
| `start` | `string` | `HH:MM` | Startzeit (24h-Format) |
| `end`   | `string` | `HH:MM` | Endzeit (24h-Format)   |

### WeeklySchedule

Woechentlicher Verfuegbarkeitsplan. Schluessel sind Wochentage als Strings (`"0"` = Sonntag, `"6"` = Samstag). Jeder Tag enthaelt ein Array von TimeSlots.

```json
{
  "1": [{ "start": "09:00", "end": "12:00" }, { "start": "14:00", "end": "17:00" }],
  "2": [{ "start": "09:00", "end": "17:00" }],
  "3": [{ "start": "09:00", "end": "17:00" }],
  "4": [{ "start": "09:00", "end": "17:00" }],
  "5": [{ "start": "09:00", "end": "12:00" }]
}
```

Tage ohne Eintraege (z.B. `"0"` und `"6"`) gelten als nicht verfuegbar.

### BlockedDate

Ein gesperrter Tag (z.B. Feiertag, Urlaub).

```json
{
  "date": "2026-12-25",
  "reason": "Weihnachten"
}
```

| Feld     | Typ      | Format       | Pflicht | Beschreibung                     |
| -------- | -------- | ------------ | ------- | -------------------------------- |
| `date`   | `string` | `YYYY-MM-DD` | ja      | Datum im ISO-Format              |
| `reason` | `string` | frei         | nein    | Optionaler Grund fuer die Sperre |

### BookingConfig

Vollstaendige Konfiguration fuer einen Buchungstyp. Wird als `configs/{id}.json` gespeichert.

```json
{
  "id": "01HYX1A2B3C4D5E6F7G8H9",
  "label": "30-Minuten Beratung",
  "slotDurationMinutes": 30,
  "bufferMinutes": 15,
  "schedule": {
    "1": [{ "start": "09:00", "end": "12:00" }, { "start": "14:00", "end": "17:00" }],
    "2": [{ "start": "09:00", "end": "17:00" }],
    "3": [{ "start": "09:00", "end": "17:00" }],
    "4": [{ "start": "09:00", "end": "17:00" }],
    "5": [{ "start": "09:00", "end": "12:00" }]
  },
  "blockedDates": [
    { "date": "2026-12-25", "reason": "Weihnachten" },
    { "date": "2026-12-26", "reason": "2. Weihnachtsfeiertag" }
  ],
  "maxAdvanceDays": 30,
  "timezone": "Europe/Berlin"
}
```

| Feld                  | Typ              | Bereich | Standard          | Beschreibung                 |
| --------------------- | ---------------- | ------- | ----------------- | ---------------------------- |
| `id`                  | `string`         | ULID    | -                 | Eindeutige ID                |
| `label`               | `string`         | min. 1  | -                 | Anzeigename                  |
| `slotDurationMinutes` | `number`         | 5-480   | -                 | Slot-Dauer in Minuten        |
| `bufferMinutes`       | `number`         | 0-120   | `0`               | Puffer zwischen Terminen     |
| `schedule`            | `WeeklySchedule` | -       | -                 | Woechentliche Verfuegbarkeit |
| `blockedDates`        | `BlockedDate[]`  | -       | `[]`              | Gesperrte Einzeltage         |
| `maxAdvanceDays`      | `number`         | 1-365   | `30`              | Max. Vorlaufzeit in Tagen    |
| `timezone`            | `string`         | min. 1  | `"Europe/Berlin"` | IANA-Zeitzone                |

### Booking

Eine einzelne Buchung. Wird im BookingStore unter `bookings/{configId}.json` gespeichert.

```json
{
  "id": "01HYX9Z8Y7X6W5V4U3T2S1",
  "configId": "01HYX1A2B3C4D5E6F7G8H9",
  "date": "2026-03-15",
  "startTime": "10:00",
  "endTime": "10:30",
  "status": "confirmed",
  "customerName": "Max Mustermann",
  "customerEmail": "max@example.com",
  "notes": "Erstgespraech zum Webprojekt",
  "createdAt": "2026-03-01T14:30:00.000Z"
}
```

| Feld            | Typ             | Format            | Standard    | Beschreibung                |
| --------------- | --------------- | ----------------- | ----------- | --------------------------- |
| `id`            | `string`        | ULID              | -           | Eindeutige Buchungs-ID      |
| `configId`      | `string`        | ULID              | -           | Referenz auf BookingConfig  |
| `date`          | `string`        | `YYYY-MM-DD`      | -           | Buchungsdatum               |
| `startTime`     | `string`        | `HH:MM`           | -           | Slot-Start                  |
| `endTime`       | `string`        | `HH:MM`           | -           | Slot-Ende                   |
| `status`        | `BookingStatus` | enum              | `"pending"` | Status der Buchung          |
| `customerName`  | `string`        | min. 1            | -           | Name des Kunden             |
| `customerEmail` | `string`        | E-Mail            | -           | E-Mail des Kunden           |
| `notes`         | `string`        | frei              | -           | Optionale Notizen           |
| `createdAt`     | `string`        | ISO 8601 datetime | -           | Erstellungszeitpunkt        |

**BookingStatus** (Enum): `"pending"` | `"confirmed"` | `"cancelled"`

### BookingStore

Container-Datei fuer alle Buchungen einer Config. Wird als `bookings/{configId}.json` gespeichert.

```json
{
  "configId": "01HYX1A2B3C4D5E6F7G8H9",
  "bookings": [
    {
      "id": "01HYX9Z8Y7X6W5V4U3T2S1",
      "configId": "01HYX1A2B3C4D5E6F7G8H9",
      "date": "2026-03-15",
      "startTime": "10:00",
      "endTime": "10:30",
      "status": "confirmed",
      "customerName": "Max Mustermann",
      "customerEmail": "max@example.com",
      "createdAt": "2026-03-01T14:30:00.000Z"
    }
  ]
}
```

## BookingEngine API

Reine Scheduling-Logik ohne I/O oder Seiteneffekte. Berechnet verfuegbare Slots und validiert neue Buchungen.

```ts
import { BookingEngine } from "@openpress/feature-booking";
```

### Konstruktor

```ts
const engine = new BookingEngine(config: BookingConfig);
```

### getAvailableSlots

Generiert alle verfuegbaren Zeitfenster fuer ein bestimmtes Datum. Beruecksichtigt:
- Woechentlichen Schedule (keine Slots an nicht konfigurierten Tagen)
- Gesperrte Daten (`blockedDates`)
- Maximale Vorlaufzeit (`maxAdvanceDays`)
- Bestehende Buchungen (nur `pending` und `confirmed` blockieren)
- Pufferzeit (`bufferMinutes`) zwischen Terminen

```ts
const slots: AvailableSlot[] = engine.getAvailableSlots(
  date: string,               // "YYYY-MM-DD"
  existingBookings: Booking[]  // Bereits vorhandene Buchungen
);
```

**Rueckgabe:** `AvailableSlot[]`

```ts
interface AvailableSlot {
  date: string;  // "YYYY-MM-DD"
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}
```

**Beispiel:**

```ts
import { BookingEngine, type BookingConfig } from "@openpress/feature-booking";

const config: BookingConfig = {
  id: "01HYX1A2B3C4D5E6F7G8H9",
  label: "30-Minuten Beratung",
  slotDurationMinutes: 30,
  bufferMinutes: 15,
  schedule: {
    "1": [{ start: "09:00", end: "12:00" }], // Montag
  },
  blockedDates: [],
  maxAdvanceDays: 30,
  timezone: "Europe/Berlin",
};

const engine = new BookingEngine(config);
const slots = engine.getAvailableSlots("2026-03-16", []);
// Ergebnis (Montag, 09:00-12:00 mit 30min Slots + 15min Puffer = 45min Schritte):
// [
//   { date: "2026-03-16", start: "09:00", end: "09:30" },
//   { date: "2026-03-16", start: "09:45", end: "10:15" },
//   { date: "2026-03-16", start: "10:30", end: "11:00" },
//   { date: "2026-03-16", start: "11:15", end: "11:45" },
// ]
```

### getAvailableSlotsForRange

Aggregiert verfuegbare Slots ueber einen Datumsbereich.

```ts
const slots: AvailableSlot[] = engine.getAvailableSlotsForRange(
  startDate: string,           // "YYYY-MM-DD"
  endDate: string,             // "YYYY-MM-DD"
  existingBookings: Booking[]
);
```

### validateBooking

Prueft ob eine neue Buchung gueltig ist. Gibt `null` bei Erfolg oder einen Fehlertext zurueck.

```ts
const error: string | null = engine.validateBooking(
  booking: Omit<Booking, "id" | "createdAt" | "status">,
  existingBookings: Booking[]
);
```

**Validierungsschritte:**

1. Datum liegt im erlaubten Bereich (`maxAdvanceDays`)
2. Datum ist nicht gesperrt (`blockedDates`)
3. Wochentag hat einen Schedule
4. Zeitfenster passt in ein Verfuegbarkeitsfenster
5. Slot-Dauer entspricht `slotDurationMinutes`
6. Kein Konflikt mit bestehenden aktiven Buchungen (inkl. Buffer)

**Beispiel:**

```ts
const error = engine.validateBooking(
  {
    configId: "01HYX1A2B3C4D5E6F7G8H9",
    date: "2026-03-16",
    startTime: "09:00",
    endTime: "09:30",
    customerName: "Anna Schmidt",
    customerEmail: "anna@example.com",
  },
  existingBookings
);

if (error) {
  console.error("Buchung ungueltig:", error);
} else {
  console.log("Buchung ist gueltig");
}
```

**Moegliche Fehlermeldungen:**

| Fehler                                                    | Ursache                                        |
| --------------------------------------------------------- | ---------------------------------------------- |
| `Date {date} is outside the allowed booking range`        | Datum in Vergangenheit oder > maxAdvanceDays    |
| `Date {date} is blocked`                                  | Datum in `blockedDates`                        |
| `No availability on this day of the week`                 | Kein Schedule fuer diesen Wochentag            |
| `Time slot {start}-{end} is outside availability windows` | Slot passt nicht in Schedule                   |
| `Slot duration must be {n} minutes, got {m}`              | Falsche Slot-Dauer                             |
| `Time slot conflicts with an existing booking`            | Ueberschneidung mit aktiver Buchung            |

## BookingStorage API

Git-backed JSON Storage fuer Configs und Buchungen. Nutzt `Bun.file()` und `Bun.write()` fuer I/O mit Zod-Validierung bei jedem Lese- und Schreibvorgang.

```ts
import { BookingStorage } from "@openpress/feature-booking";
```

### Konstruktor und Initialisierung

```ts
const storage = new BookingStorage({
  bookingDir: "./content/bookings",
});

// Verzeichnisse anlegen (configs/ und bookings/)
await storage.init();
```

### Config-Operationen

```ts
// Config schreiben
await storage.writeConfig(config: BookingConfig): Promise<void>;

// Config lesen (wirft BookingFileIOError wenn nicht gefunden)
const config = await storage.readConfig(configId: string): Promise<BookingConfig>;

// Alle Configs auflisten
const configs = await storage.listConfigs(): Promise<BookingConfig[]>;

// Config loeschen
await storage.deleteConfig(configId: string): Promise<void>;

// Existenz pruefen
const exists = await storage.configExists(configId: string): Promise<boolean>;
```

### Buchungs-Operationen

```ts
// BookingStore lesen (leerer Store falls noch keine Buchungen)
const store = await storage.readBookingStore(
  configId: string
): Promise<BookingStore>;

// BookingStore komplett schreiben
await storage.writeBookingStore(store: BookingStore): Promise<void>;

// Einzelne Buchung hinzufuegen (liest Store, haengt an, schreibt zurueck)
await storage.addBooking(booking: Booking): Promise<void>;

// Buchung aktualisieren (Status oder Notizen)
const updated = await storage.updateBooking(
  configId: string,
  bookingId: string,
  update: Partial<Pick<Booking, "status" | "notes">>
): Promise<Booking>;

// Buchungen fuer ein Datum filtern
const bookings = await storage.getBookingsForDate(
  configId: string,
  date: string   // "YYYY-MM-DD"
): Promise<Booking[]>;

// Alle Buchungen einer Config
const all = await storage.getAllBookings(
  configId: string
): Promise<Booking[]>;
```

### Vollstaendiges Beispiel

```ts
import { BookingStorage, BookingEngine } from "@openpress/feature-booking";
import type { BookingConfig, Booking } from "@openpress/feature-booking";
import { ulid } from "ulid";

// 1. Storage initialisieren
const storage = new BookingStorage({ bookingDir: "./content/bookings" });
await storage.init();

// 2. Config anlegen
const config: BookingConfig = {
  id: ulid(),
  label: "Erstgespraech (60 Min.)",
  slotDurationMinutes: 60,
  bufferMinutes: 15,
  schedule: {
    "1": [{ start: "09:00", end: "17:00" }],
    "2": [{ start: "09:00", end: "17:00" }],
    "3": [{ start: "09:00", end: "17:00" }],
    "4": [{ start: "09:00", end: "17:00" }],
    "5": [{ start: "09:00", end: "13:00" }],
  },
  blockedDates: [{ date: "2026-04-03", reason: "Karfreitag" }],
  maxAdvanceDays: 60,
  timezone: "Europe/Berlin",
};
await storage.writeConfig(config);

// 3. Verfuegbare Slots berechnen
const engine = new BookingEngine(config);
const existing = await storage.getAllBookings(config.id);
const slots = engine.getAvailableSlots("2026-03-16", existing);

// 4. Buchung validieren und speichern
const bookingData = {
  configId: config.id,
  date: "2026-03-16",
  startTime: slots[0].start,
  endTime: slots[0].end,
  customerName: "Lisa Mueller",
  customerEmail: "lisa@example.com",
  notes: "Website-Relaunch besprechen",
};

const validationError = engine.validateBooking(bookingData, existing);
if (!validationError) {
  const booking: Booking = {
    ...bookingData,
    id: ulid(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await storage.addBooking(booking);
}

// 5. Buchung bestaetigen
const bookings = await storage.getAllBookings(config.id);
await storage.updateBooking(config.id, bookings[0].id, {
  status: "confirmed",
});
```

## OpBooking Komponente

Die `OpBooking` Vue-Komponente wird als Block im visuellen Editor eingefuegt. Sie ist **theme-agnostisch** und stellt Named Slots fuer die visuelle Gestaltung bereit.

### Props

| Prop          | Typ      | Standard                | Beschreibung                    |
| ------------- | -------- | ----------------------- | ------------------------------- |
| `configId`    | `string` | -                       | ULID-Referenz auf BookingConfig |
| `heading`     | `string` | `"Book an Appointment"` | Ueberschrift                    |
| `description` | `string` | `""`                    | Beschreibungstext               |

### Template-Slots

| Slot       | Beschreibung                                    |
| ---------- | ----------------------------------------------- |
| `calendar` | Kalender-Widget (vom Theme bereitgestellt)      |
| `slots`    | Zeitfenster-Auswahl (vom Theme bereitgestellt)  |

### Verwendung im Template

```vue
<!-- Einfache Verwendung (Standard-UI vom Theme) -->
<OpBooking
  config-id="01HYX1A2B3C4D5E6F7G8H9"
  heading="Termin buchen"
  description="Waehlen Sie einen passenden Termin aus."
/>

<!-- Mit Theme-spezifischer Kalender-UI -->
<OpBooking config-id="01HYX1A2B3C4D5E6F7G8H9" heading="Beratungstermin">
  <template #calendar>
    <MyThemeCalendar @date-selected="onDateSelected" />
  </template>
  <template #slots>
    <MyThemeSlotPicker :slots="availableSlots" @slot-selected="onSlotSelected" />
  </template>
</OpBooking>
```

### Verwendung als Block (im Editor)

Die Komponente wird ueber das Feature-Manifest als Block registriert. Im Editor kann sie per Component Picker eingefuegt werden:

```json
{
  "type": "op-booking",
  "props": {
    "configId": "01HYX1A2B3C4D5E6F7G8H9",
    "heading": "Termin buchen",
    "description": "Waehlen Sie Ihren Wunschtermin."
  }
}
```

### BookingSettingsPanel

Editor-Seitenpanel fuer die Konfiguration von Buchungseinstellungen. Wird im OpenPress-Editor-Sidebar angezeigt, wenn ein `op-booking` Block ausgewaehlt ist.

```
/_edit Sidebar → Booking Settings → Verfuegbarkeit, Zeitfenster, gesperrte Tage
```

## Dashboard-Integration

Das Feature registriert eine Admin-Seite unter `/_edit/bookings` im OpenPress-Editor.

### Registrierung ueber Feature Manifest

Die Dashboard-Route wird deklarativ im `openpress.feature.json` registriert:

```json
{
  "editorRoutes": [
    {
      "path": "/_edit/bookings",
      "label": "Bookings",
      "component": "./runtime/pages/BookingsDashboard.vue",
      "icon": "mdi:calendar-check"
    }
  ]
}
```

Der Core erkennt dieses Manifest automatisch ueber das Feature-Discovery-System und bindet die Route in die Editor-Navigation ein.

### Integrations-Pattern

Das Pattern fuer die Dashboard-Integration folgt dem OpenPress Feature-Manifest-System:

```
1. Feature-Paket enthaelt openpress.feature.json
2. Core's Feature Registry entdeckt das Manifest beim Start
3. editorRoutes werden als /_edit/* Routen registriert
4. editorPanels werden in der Editor-Sidebar verfuegbar
5. blocks werden im Component Picker angezeigt
```

**Zusammenspiel der Schichten im Dashboard:**

```ts
// Server-seitig (API-Route oder Server-Composable)
import { BookingStorage, BookingEngine } from "@openpress/feature-booking";

const storage = new BookingStorage({
  bookingDir: "./content/bookings",
});

// Alle Configs laden
const configs = await storage.listConfigs();

// Buchungen fuer eine Config laden und Engine nutzen
for (const config of configs) {
  const engine = new BookingEngine(config);
  const bookings = await storage.getAllBookings(config.id);
  const todaySlots = engine.getAvailableSlots("2026-03-16", bookings);
  // ... Dashboard-Daten zusammenstellen
}
```

## Feature Manifest

Die Datei `openpress.feature.json` deklariert alle Integrationspunkte:

| Bereich        | Typ          | Beschreibung                              |
| -------------- | ------------ | ----------------------------------------- |
| `blocks`       | Block-Typ    | `op-booking` - Kalender-Widget fuer Seiten |
| `editorPanels` | Editor-Panel | `booking-settings` - Konfigurations-Sidebar |
| `editorRoutes` | Admin-Route  | `/_edit/bookings` - Buchungs-Dashboard     |

## Fehlerbehandlung

Das Paket definiert zwei spezialisierte Fehlerklassen:

### BookingFileIOError

Wird bei Datei-Operationen geworfen (Datei nicht gefunden, Schreibfehler).

```ts
import { BookingFileIOError } from "@openpress/feature-booking";

try {
  await storage.readConfig("non-existent-id");
} catch (err) {
  if (err instanceof BookingFileIOError) {
    console.error(err.message); // "File not found: ..."
    console.error(err.path);    // Betroffener Dateipfad
    console.error(err.cause);   // Urspruenglicher Fehler
  }
}
```

### BookingValidationError

Wird geworfen wenn JSON-Daten die Zod-Schema-Validierung nicht bestehen.

```ts
import { BookingValidationError } from "@openpress/feature-booking";

try {
  await storage.writeConfig(invalidConfig);
} catch (err) {
  if (err instanceof BookingValidationError) {
    console.error(err.message); // "Validation failed ..."
    console.error(err.path);    // Betroffener Dateipfad
    console.error(err.issues);  // Zod-Validierungsfehler
  }
}
```

## Tests

57 Tests in 3 Testdateien, 100% bestanden.

```bash
bun test packages/feature-booking/
```

| Datei                            | Tests | Prueft                                       |
| -------------------------------- | ----- | -------------------------------------------- |
| `tests/schemas.test.ts`         | 21    | Zod-Schema-Validierung aller Datenstrukturen |
| `tests/booking-engine.test.ts`  | 22    | Slot-Generierung, Validierung, Buffer-Logik  |
| `tests/booking-storage.test.ts` | 14    | CRUD-Operationen, Fehlerbehandlung           |

## Status

Phase 0 - Infrastruktur komplett, Vue-Komponenten sind Shells (warten auf Theme-Integration).
