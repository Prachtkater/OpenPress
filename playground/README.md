# OpenPress Playground - CEO Demo

## Schnellstart (3 Schritte)

```bash
# 1. Im Workspace-Root: Abhaengigkeiten installieren
cd /home/giovanni/.openclaw/workspace
bun install

# 2. Playground starten
bun run dev

# 3. Im Browser oeffnen
#    Startseite:  http://localhost:3000
#    Editor:      http://localhost:3000/_edit
```

## Was du sehen wirst

### Startseite (http://localhost:3000)

Die Demo-Seite zeigt alle Faehigkeiten von OpenPress auf einen Blick:

| Section | Bloecke | Was es zeigt |
|---------|---------|--------------|
| Hero | Heading (H1), Paragraph, 2x Button | Aufmerksamkeitsstarker Einstieg mit CTA |
| Visual-First Editing | Heading (H2), Paragraph, Image | In-Context-Editing Konzept + Bild |
| Core Features | 4x Heading (H2/H3), 4x Paragraph | Git Storage, HMR, Zod Schemas |
| Video | Heading (H2), Video | Eingebetteter Video-Player |
| Theme-System | 2x Heading (H2/H3), 3x Paragraph, Image | Tailwind Plus vs. Material Expressive |
| Kontaktformular | Heading (H2), Paragraph, ContactForm | 6-Feld-Formular mit Validierung |
| Terminbuchung | Heading (H2), Paragraph, Booking | Scheduling-Engine mit Kalender |
| CTA | Heading (H2), Paragraph, Button (XL) | Abschluss-Call-to-Action |

**Demonstrierte Block-Typen:** Heading (H1-H3), Paragraph, Image, Button (solid/outline, primary/secondary), Video, ContactForm, Booking

### Editor-UI (http://localhost:3000/_edit)

- **Sitemap-Dashboard**: Liste aller Seiten mit Slug, Titel, Zeitstempel
- **Page Editor**: Klick auf eine Seite oeffnet den visuellen Editor
- **Glow-Frame**: Editierbare Bereiche leuchten beim Hover auf
- **Edit/Preview Toggle**: Umschalten zwischen Bearbeitungs- und Vorschau-Modus

## Theme-Switching

Das aktive Theme wird in `playground/content/site.json` konfiguriert:

```json
{
  "theme": "tailwind-plus"
}
```

Aendern zu `"material-expressive"` fuer das Material Design 3 Theme.
Die Seite aktualisiert sich automatisch via HMR.

## Architektur-Uebersicht

```
playground/
  nuxt.config.ts          # Bindet Core + Features ein
  content/
    site.json             # Globale Konfiguration (Name, Theme, Locale)
    navigation.json       # Haupt- und Footer-Navigation
    pages/
      index.json          # Startseite mit 8 Sections, 33 Bloecken
```

### Eingebundene Pakete

| Paket | Rolle |
|-------|-------|
| @openpress/core | Nuxt-Modul: Editor, Storage, HMR, API |
| @openpress/schemas | Zod-Schemas fuer alle Datenstrukturen |
| @openpress/ui | Komponentensystem (OpSection, OpSlot) |
| @openpress/theme-tailwind-plus | Tailwind CSS Theme |
| @openpress/theme-material-expressive | Material Design 3 Theme |
| @openpress/feature-contact-form | Kontaktformular mit E-Mail-Versand |
| @openpress/feature-booking | Terminbuchung mit Kalender-Engine |

### Feature-Discovery

Die Feature-Module werden automatisch erkannt. Jedes Feature bringt eine `openpress.feature.json` Manifest-Datei mit, die beim Start vom Core gescannt wird. In der Konsole erscheint:

```
[openpress] Discovered 2 feature(s): Kontaktformular, Booking
```

## Qualitaetsstatus

```bash
# Tests ausfuehren
bun test

# TypeScript Pruefung
bun x tsc --noEmit
```

Erwartet: 642+ Tests bestanden, 0 TypeScript-Fehler.
