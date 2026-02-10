# @openpress/schemas

Zentrale Zod-Schema-Definitionen fuer OpenPress.

## Ziel

- **Single Source of Truth** fuer alle Datenstrukturen
- Page-Schema: Seitenstruktur mit Sections, Slots und Blocks
- Block-Schemas: Typdefinitionen fuer jeden Block-Typ
- Navigation-Schema: Menustruktur und Links
- Site-Config-Schema: Globale Website-Einstellungen
- Feature-Manifest-Schema: Definition fuer Feature-Module
- TypeScript-Types werden automatisch aus Zod-Schemas abgeleitet

## Architektur

```
src/
  blocks/         # Block-spezifische Schemas (rich-text, image, ...)
  page.ts         # Page-Struktur Schema
  navigation.ts   # Navigations-Schema
  site.ts         # Site-Config Schema
  manifest.ts     # Feature-Manifest Schema
  index.ts        # Re-exports
```

## Status

Phase 0 - Wird parallel zu POC 1 entwickelt
