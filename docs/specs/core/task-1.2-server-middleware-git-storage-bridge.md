# Task 1.2: Server-Middleware für Git-Storage Bridge

**Epic:** 1 - Core Framework & Nuxt Module Logic
**Status:** Spezifikation
**Spezialist:** Agent Core
**Abhängigkeit:** Task 1.1 (Module-Registrierung)

---

## 1. Ziel

Server-seitige Brücke zwischen den Nuxt API-Routes und der Git-Storage Engine aus POC 1.
Diese Middleware:
- Initialisiert die `StorageEngine` als Singleton pro Server-Instanz
- Stellt typisierte API-Endpunkte für CRUD-Operationen bereit
- Mappt HTTP-Verben auf StorageEngine-Methoden
- Stellt Git-Operationen (Commit, History, Status) als REST-API bereit
- Validiert alle Ein-/Ausgaben mit Zod-Schemas aus `@openpress/schemas`

## 2. Kontext

### 2.1 POC-1 Storage Engine (validiert)

Die `StorageEngine` aus `@openpress/poc-storage` ist vollständig getestet (13/13 Tests):

```
StorageEngine
├── readPage(slug) → Page
├── writePage(slug, page) → void
├── deletePage(slug) → void
├── listPages() → PageListItem[]
├── pageExists(slug) → boolean
├── readSiteConfig() → SiteConfig
├── writeSiteConfig(config) → void
├── readNavigation() → Navigation
├── writeNavigation(nav) → void
├── commit(message) → CommitResult { hash, message }
├── getHistory(slug?) → CommitLogEntry[]
├── hasChanges() → boolean
└── init() → void
```

**Technische Merkmale:**
- Git-Ops via `Bun.spawn(['git', ...])` (kein simple-git)
- File-I/O via `Bun.file()` / `Bun.write()`
- Zod-Validierung bei jedem Read/Write
- Fehlerklassen: `FileIOError`, `ValidationError`

### 2.2 Content-Verzeichnisstruktur

```
content/
  site.json              # SiteConfigSchema
  navigation.json        # NavigationSchema
  pages/
    index.json           # PageSchema
    about.json           # PageSchema
    blog/
      my-post.json       # PageSchema (verschachtelte Slugs möglich)
```

## 3. Technisches Design

### 3.1 StorageEngine Singleton

```
packages/core/src/runtime/server/utils/storage.ts
```

Die StorageEngine wird einmal pro Server-Lifecycle instanziiert:

```typescript
import { StorageEngine } from '@openpress/poc-storage'
import type { StorageEngineOptions } from '@openpress/poc-storage'

let _engine: StorageEngine | null = null

export async function useStorageEngine(): Promise<StorageEngine> {
  if (_engine) return _engine

  const config = useRuntimeConfig()
  const options: StorageEngineOptions = {
    contentDir: config.openpress.contentDir,
    repoRoot: config.openpress.repoRoot,
  }

  _engine = new StorageEngine(options)
  await _engine.init()
  return _engine
}
```

**Begründung Singleton-Pattern:**
- StorageEngine hält keinen mutable State - sie ist ein Gateway zum Dateisystem
- Mehrfach-Initialisierung würde unnötige `git init`-Checks verursachen
- Der Singleton lebt für die Dauer des Nitro-Server-Processes

### 3.2 API-Endpunkte im Detail

Alle Routes unter `/api/_openpress/`. Nitro Event-Handler mit `defineEventHandler()`.

---

#### 3.2.1 Pages API

**`GET /api/_openpress/pages`** - Seitenübersicht

```typescript
// runtime/server/api/pages/index.get.ts
export default defineEventHandler(async () => {
  const engine = await useStorageEngine()
  return await engine.listPages()
})
```

Response: `PageListItem[]` (slug, title, updatedAt, createdAt)

---

**`GET /api/_openpress/pages/:slug`** - Einzelne Seite lesen

```typescript
// runtime/server/api/pages/[slug].get.ts
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Slug required' })

  const engine = await useStorageEngine()
  try {
    return await engine.readPage(slug)
  } catch (error) {
    if (error instanceof FileIOError) {
      throw createError({ statusCode: 404, message: `Page '${slug}' not found` })
    }
    throw error
  }
})
```

Response: `Page` (vollständiges Page-Objekt mit Sections/Blocks)

---

**`PUT /api/_openpress/pages/:slug`** - Seite speichern

```typescript
// runtime/server/api/pages/[slug].put.ts
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Slug required' })

  const body = await readBody(event)
  const result = PageSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      message: 'Validation failed',
      data: result.error.issues
    })
  }

  const engine = await useStorageEngine()
  await engine.writePage(slug, result.data)

  // Auto-Commit wenn konfiguriert
  const config = useRuntimeConfig()
  if (config.openpress.autoCommit) {
    await engine.commit(`content: update page '${slug}'`)
  }

  setResponseStatus(event, 200)
  return result.data
})
```

**Auto-Commit Logik:**
- Wenn `openpress.storage.autoCommit: true` (Default), wird nach jedem Write automatisch committed
- Commit-Message folgt Conventional-Commits: `content: update page 'slug'`
- Bei `autoCommit: false` muss der Client explizit `POST /git/commit` aufrufen

---

**`DELETE /api/_openpress/pages/:slug`** - Seite löschen

```typescript
// runtime/server/api/pages/[slug].delete.ts
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Slug required' })

  const engine = await useStorageEngine()

  if (!(await engine.pageExists(slug))) {
    throw createError({ statusCode: 404, message: `Page '${slug}' not found` })
  }

  await engine.deletePage(slug)

  const config = useRuntimeConfig()
  if (config.openpress.autoCommit) {
    await engine.commit(`content: delete page '${slug}'`)
  }

  setResponseStatus(event, 204)
  return null
})
```

---

#### 3.2.2 Site Config API

**`GET /api/_openpress/site`**

```typescript
// runtime/server/api/site.get.ts
export default defineEventHandler(async () => {
  const engine = await useStorageEngine()
  return await engine.readSiteConfig()
})
```

---

**`PUT /api/_openpress/site`**

```typescript
// runtime/server/api/site.put.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = SiteConfigSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, message: 'Validation failed', data: result.error.issues })
  }

  const engine = await useStorageEngine()
  await engine.writeSiteConfig(result.data)

  const config = useRuntimeConfig()
  if (config.openpress.autoCommit) {
    await engine.commit('config: update site configuration')
  }

  return result.data
})
```

---

#### 3.2.3 Navigation API

**`GET /api/_openpress/navigation`**

```typescript
// runtime/server/api/navigation.get.ts
export default defineEventHandler(async () => {
  const engine = await useStorageEngine()
  return await engine.readNavigation()
})
```

---

**`PUT /api/_openpress/navigation`**

```typescript
// runtime/server/api/navigation.put.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = NavigationSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 422, message: 'Validation failed', data: result.error.issues })
  }

  const engine = await useStorageEngine()
  await engine.writeNavigation(result.data)

  const config = useRuntimeConfig()
  if (config.openpress.autoCommit) {
    await engine.commit('config: update navigation')
  }

  return result.data
})
```

---

#### 3.2.4 Git Operations API

**`POST /api/_openpress/git/commit`** - Manueller Commit

```typescript
// runtime/server/api/git/commit.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const message = body?.message
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Commit message required' })
  }

  const engine = await useStorageEngine()

  if (!(await engine.hasChanges())) {
    throw createError({ statusCode: 409, message: 'No changes to commit' })
  }

  const result = await engine.commit(message.trim())
  return result  // { hash, message }
})
```

---

**`GET /api/_openpress/git/history`** - Commit-Historie

```typescript
// runtime/server/api/git/history.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const slug = query.slug as string | undefined

  const engine = await useStorageEngine()
  return await engine.getHistory(slug)
})
```

Query-Parameter:
- `?slug=about` - Historie für eine bestimmte Seite
- Ohne Parameter - Gesamte Content-Historie

---

**`GET /api/_openpress/git/status`** - Änderungsstatus

```typescript
// runtime/server/api/git/status.get.ts
export default defineEventHandler(async () => {
  const engine = await useStorageEngine()
  const hasChanges = await engine.hasChanges()
  return { hasChanges }
})
```

---

### 3.3 Error-Handling Middleware

Zentrale Fehlerbehandlung für alle OpenPress API-Routes:

```
packages/core/src/runtime/server/middleware/openpress-error.ts
```

```typescript
export default defineEventHandler(async (event) => {
  // Nur für OpenPress API-Routes
  if (!event.path.startsWith('/api/_openpress')) return

  try {
    // Request weiterleiten (noop - Nitro handled die Route)
  } catch (error) {
    if (error instanceof FileIOError) {
      throw createError({
        statusCode: error.path ? 404 : 500,
        message: error.message
      })
    }
    if (error instanceof ValidationError) {
      throw createError({
        statusCode: 422,
        message: error.message,
        data: { issues: error.issues, path: error.path }
      })
    }
    // Unbekannte Fehler durchreichen
    throw error
  }
})
```

### 3.4 Fehler-Mapping

| StorageEngine Error | HTTP Status | Beschreibung |
|---------------------|-------------|-------------|
| `FileIOError` (ENOENT) | 404 | Datei nicht gefunden |
| `FileIOError` (andere) | 500 | Dateisystem-Fehler |
| `ValidationError` | 422 | Zod-Validierung fehlgeschlagen |
| Git-Fehler | 500 | Git-Operation fehlgeschlagen |
| Body-Parse-Fehler | 400 | Ungültiger Request-Body |
| Fehlender Slug | 400 | Pflicht-Parameter fehlt |
| Keine Änderungen | 409 | Commit ohne Änderungen |

### 3.5 Response-Formate

Alle Responses als JSON. Erfolgreiche Antworten:

```typescript
// Erfolg mit Daten
{ statusCode: 200, body: Page | SiteConfig | Navigation | ... }

// Erfolg ohne Body
{ statusCode: 204 }

// Fehler
{
  statusCode: 422,
  message: "Validation failed",
  data: {
    issues: ZodIssue[],
    path: string
  }
}
```

## 4. Datenfluss

```
Client (Editor UI)
  │
  ▼
HTTP Request (PUT /api/_openpress/pages/about)
  │
  ▼
Nitro Event Handler ([slug].put.ts)
  │
  ├── 1. Slug aus Route extrahieren
  ├── 2. Body parsen & mit Zod validieren
  ├── 3. StorageEngine Singleton abrufen
  ├── 4. engine.writePage(slug, page)
  │     ├── Zod-Validierung (nochmal, Defense-in-Depth)
  │     ├── JSON.stringify + Bun.write()
  │     └── Datei: content/pages/about.json
  ├── 5. Auto-Commit (wenn aktiviert)
  │     ├── git add -A content/
  │     └── git commit -m "content: update page 'about'"
  └── 6. Response: 200 + Page JSON
  │
  ▼
Client erhält aktualisierte Page-Daten
```

## 5. Sicherheitsaspekte

### 5.1 Input-Validierung

- **Doppelte Validierung:** Zod-Check im API-Handler UND in der StorageEngine (Defense-in-Depth)
- **Slug-Sanitization:** Regex `/^[a-z0-9][a-z0-9-]*$/` verhindert Path-Traversal
- **Body-Size:** Nitro Default-Limit (1MB) reicht für JSON-Content

### 5.2 Path-Traversal Schutz

Der Slug wird direkt als Dateiname verwendet (`{contentDir}/pages/{slug}.json`).
Die Regex-Validierung im `PageSchema` verhindert:
- `../` Traversal (Punkt nicht erlaubt)
- Absolute Pfade (Slash nicht erlaubt)
- Null-Bytes und Sonderzeichen

### 5.3 Git-Safety

- `Bun.spawn(['git', ...])` mit Array-Argumenten verhindert Shell-Injection
- Commit-Messages werden als einzelnes Argument übergeben (kein Shell-Escaping nötig)
- Nur der `content/`-Ordner wird gestaged (`git add -A contentDir`)

## 6. POC-zu-Core Migration

Die StorageEngine aus POC 1 wird für den Core übernommen mit minimalen Anpassungen:

| POC 1 | Core | Änderung |
|-------|------|----------|
| `@openpress/poc-storage` | In `@openpress/core` integriert | Package wird inline, nicht als Dependency |
| `StorageEngine` Klasse | Unverändert | API-Surface bleibt identisch |
| `FileIOError` / `ValidationError` | Unverändert | Werden re-exportiert |
| `Bun.spawn` für Git | Unverändert | Funktioniert in Nitro-Server-Kontext |
| `Bun.file` / `Bun.write` | Unverändert | Bun-Runtime im Server gewährleistet |

**Entscheidung:** Die StorageEngine wird als internes Modul in `packages/core/src/runtime/server/lib/storage-engine/` kopiert, nicht als externe Dependency. Gründe:
- Vermeidet zirkuläre Workspace-Dependencies
- Erlaubt Nitro-spezifische Anpassungen (z.B. H3 Event-Integration)
- POC bleibt als Referenz erhalten

## 7. Abhängigkeiten

| Paket | Zweck |
|-------|-------|
| `h3` | Event-Handler, `createError`, `readBody`, `getRouterParam` |
| `@openpress/schemas` | Zod-Schemas für Validierung |
| `nitropack` | Server-Runtime (implizit durch Nuxt) |
| Bun Runtime | `Bun.spawn`, `Bun.file`, `Bun.write` |

## 8. Testplan

### 8.1 Unit Tests (StorageEngine)

Bereits durch POC 1 abgedeckt (13/13 Tests). Werden in Core-Package übernommen.

### 8.2 API Integration Tests

| Test | Method | Route | Erwartung |
|------|--------|-------|-----------|
| List empty pages | GET | `/api/_openpress/pages` | `200`, `[]` |
| Create page | PUT | `/api/_openpress/pages/test` | `200`, Page |
| Read page | GET | `/api/_openpress/pages/test` | `200`, Page |
| Read missing page | GET | `/api/_openpress/pages/nope` | `404` |
| Delete page | DELETE | `/api/_openpress/pages/test` | `204` |
| Invalid body | PUT | `/api/_openpress/pages/test` | `422`, Zod Issues |
| Invalid slug | PUT | `/api/_openpress/pages/UPPER` | `422` |
| Read site config | GET | `/api/_openpress/site` | `200`, SiteConfig |
| Update site config | PUT | `/api/_openpress/site` | `200`, SiteConfig |
| Read navigation | GET | `/api/_openpress/navigation` | `200`, Navigation |
| Manual commit | POST | `/api/_openpress/git/commit` | `200`, CommitResult |
| Commit without changes | POST | `/api/_openpress/git/commit` | `409` |
| Get history | GET | `/api/_openpress/git/history` | `200`, CommitLogEntry[] |
| Get status | GET | `/api/_openpress/git/status` | `200`, `{ hasChanges }` |

### 8.3 Test-Setup

```typescript
import { setup, $fetch } from '@nuxt/test-utils'

describe('OpenPress API', () => {
  await setup({
    rootDir: resolve(__dirname, '../playground'),
    server: true
  })

  it('lists pages', async () => {
    const pages = await $fetch('/api/_openpress/pages')
    expect(pages).toBeArray()
  })
})
```

## 9. Akzeptanzkriterien

- [ ] StorageEngine wird als Singleton initialisiert und wiederverwendet
- [ ] Alle CRUD-Routes für Pages, Site, Navigation funktionieren
- [ ] Zod-Validierung läuft vor jedem Write (422 bei Fehler)
- [ ] Auto-Commit erstellt Git-Commits nach Write-Operationen
- [ ] Git-Status und History sind per API abfragbar
- [ ] Path-Traversal über Slug ist nicht möglich
- [ ] Fehler werden mit korrekten HTTP-Status-Codes zurückgegeben
- [ ] POC-1 Tests laufen auch im Core-Package
