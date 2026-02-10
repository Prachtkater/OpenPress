# POC 1: Git-backed JSON Storage Engine - Technische Spezifikation

## Ueberblick

Validierung des zentralen Storage-Konzepts: JSON-Dateien im Git-Repository als
Single Source of Truth fuer allen Website-Content.

## Datenmodell

### Verzeichnisstruktur im Content-Repository

```
content/
  site.json              # Globale Site-Konfiguration
  navigation.json        # Menue-Struktur
  pages/
    index.json           # Startseite
    about.json           # Ueber uns
    contact.json         # Kontakt
  media/
    registry.json        # Media-Metadaten
```

### Page-Dokument (Beispiel: pages/index.json)

```json
{
  "id": "01HQ3K5P7VXYZ...",
  "slug": "index",
  "title": "Startseite",
  "meta": {
    "description": "Willkommen bei ...",
    "ogImage": "/media/hero.jpg"
  },
  "sections": [
    {
      "id": "01HQ3K5P8AXYZ...",
      "type": "hero",
      "slots": {
        "default": [
          {
            "id": "01HQ3K5P9BXYZ...",
            "type": "rich-text",
            "props": {
              "content": "<h1>Willkommen</h1><p>Bei OpenPress.</p>"
            }
          }
        ],
        "aside": []
      }
    }
  ],
  "updatedAt": "2025-02-10T20:00:00Z",
  "createdAt": "2025-02-10T18:00:00Z"
}
```

## API-Design (Storage Engine)

### StorageEngine Interface

```typescript
interface StorageEngine {
  // Pages
  readPage(slug: string): Promise<Page>
  writePage(slug: string, page: Page): Promise<void>
  listPages(): Promise<PageMeta[]>
  deletePage(slug: string): Promise<void>

  // Site Config
  readSiteConfig(): Promise<SiteConfig>
  writeSiteConfig(config: SiteConfig): Promise<void>

  // Navigation
  readNavigation(): Promise<Navigation>
  writeNavigation(nav: Navigation): Promise<void>

  // Git Operations
  commit(message: string): Promise<CommitResult>
  getHistory(slug?: string): Promise<CommitLog[]>

  // Locking (fuer zukuenftige Multi-User Szenarien)
  acquireLock(resource: string): Promise<Lock>
  releaseLock(lock: Lock): Promise<void>
}
```

### Ablauf: Edit -> Save -> Commit

```
1. User editiert Block im Editor
2. Editor ruft writePage(slug, updatedPage) auf
3. Storage Engine:
   a. Validiert updatedPage gegen PageSchema (Zod)
   b. Serialisiert zu JSON mit Formatting
   c. Schreibt via Bun.write() ins Dateisystem
4. User klickt "Veroeffentlichen"
5. Editor ruft commit("Update Startseite: Hero-Text geaendert") auf
6. Storage Engine:
   a. git add content/pages/index.json
   b. git commit -m "Update Startseite: Hero-Text geaendert"
7. Commit-Hash wird zurueckgegeben
```

## Zod-Schemas (Kern-Definitionen)

### Block-Schema

```typescript
const BlockSchema = z.object({
  id: z.string().ulid(),
  type: z.string().min(1),
  props: z.record(z.unknown()),
})

const SlotSchema = z.array(BlockSchema)

const SectionSchema = z.object({
  id: z.string().ulid(),
  type: z.string().min(1),
  slots: z.record(SlotSchema),
})

const PageSchema = z.object({
  id: z.string().ulid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  meta: z.object({
    description: z.string().optional(),
    ogImage: z.string().optional(),
  }),
  sections: z.array(SectionSchema),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
})
```

## Implementierungsschritte

### Schritt 1: Schemas definieren
- Zod-Schemas fuer Page, Block, Section, Slot, SiteConfig, Navigation
- TypeScript-Types ableiten mit z.infer<>
- Export aus @openpress/schemas

### Schritt 2: File I/O Layer
- readJSON<T>(path, schema): Lesen + Validieren
- writeJSON<T>(path, data, schema): Validieren + Schreiben
- Bun.file() / Bun.write() nutzen
- Pretty-print JSON (2-space indent)

### Schritt 3: Git Layer
- simple-git oder native `Bun.spawn(['git', ...])` evaluieren
- commit(message): Stage geaenderte Files + Commit
- getHistory(): Git-Log parsen

### Schritt 4: StorageEngine Klasse
- Zusammenfuehren von File I/O + Git + Schemas
- CRUD fuer Pages, SiteConfig, Navigation
- Error Handling mit typisierten Fehlern

### Schritt 5: Tests
- Unit-Tests fuer Schema-Validierung
- Integration-Tests fuer Read/Write/Commit-Zyklen
- Performance-Benchmark (< 100ms pro Page-Read)

## Offene Fragen

1. **Git-Strategie**: `simple-git` npm-Paket vs. native `git` CLI via Bun.spawn?
   -> Empfehlung: Starte mit Bun.spawn fuer minimale Dependencies
2. **Locking**: Brauchen wir File-Locking fuer den POC?
   -> Nein, Single-User reicht fuer POC
3. **Content-Verzeichnis**: Fest im Repo-Root oder konfigurierbar?
   -> Konfigurierbar mit Default `./content`

## Erfolgskriterien

- [ ] Page erstellen, lesen, updaten, loeschen (CRUD)
- [ ] Zod-Validierung faengt invalide Daten ab
- [ ] Jede Aenderung wird als Git-Commit gespeichert
- [ ] Git-History ist sauber und nachvollziehbar
- [ ] Performance: < 100ms fuer Page-Read
- [ ] ULID-IDs werden korrekt generiert und persistiert
