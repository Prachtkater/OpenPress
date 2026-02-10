# Task 1.3: HMR-Integration für JSON-Inhalte

**Epic:** 1 - Core Framework & Nuxt Module Logic
**Status:** Spezifikation
**Spezialist:** Agent Core
**Abhängigkeiten:** Task 1.1 (Module-Hooks), Task 1.2 (Storage Bridge)

---

## 1. Ziel

Hot Module Replacement (HMR) für JSON-Content-Dateien im `content/`-Verzeichnis.
Wenn eine JSON-Datei geändert wird (durch den Editor ODER externe Tools wie VS Code),
soll die laufende Nuxt-Dev-Instanz:
- Die Änderung erkennen
- Den betroffenen Content neu laden (ohne Full-Page-Reload)
- Die Vue-Komponenten mit den neuen Daten aktualisieren
- Den Editor-State synchronisieren

## 2. Problemstellung

Nuxt 3 hat eingebautes HMR für:
- Vue-Komponenten (`.vue`)
- TypeScript/JavaScript (`.ts`, `.js`)
- CSS/SCSS
- Nuxt Content Modul (`.md`, `.yaml`)

**Nicht abgedeckt:** Beliebige JSON-Dateien außerhalb von `node_modules` und `public/`.

OpenPress speichert Content als JSON in `content/`. Änderungen an diesen Dateien müssen
in Echtzeit reflektiert werden - sowohl in der Website-Vorschau als auch im Editor.

## 3. Technisches Design

### 3.1 Architektur-Übersicht

```
content/pages/about.json  (Datei ändert sich)
        │
        ▼
  [Chokidar / Bun Watcher]  ← Nitro Dev-Server
        │
        ▼
  [Nuxt Hook: builder:watch]  ← module.ts registriert Handler
        │
        ├──▶ Datei-Typ erkennen (page / site / navigation)
        ├──▶ Betroffenen Slug extrahieren
        └──▶ WebSocket-Event an Client senden
              │
              ▼
        [Client: HMR Handler]
              │
              ├──▶ Content über API neu fetchen
              ├──▶ Reactive State aktualisieren
              └──▶ Vue re-rendert betroffene Komponenten
```

### 3.2 Server-Side: File Watcher Integration

#### 3.2.1 Nuxt `builder:watch` Hook

Nuxt nutzt intern bereits einen File-Watcher (Chokidar/Parcel) für HMR.
Über den `builder:watch` Hook können wir auf Datei-Änderungen reagieren:

```typescript
// In module.ts setup():
if (nuxt.options.dev) {
  const contentDir = resolver.resolve(nuxt.options.rootDir, options.contentDir)

  // Content-Verzeichnis zum Watch-Scope hinzufügen
  nuxt.options.watch.push(contentDir)

  nuxt.hook('builder:watch', async (event, relativePath) => {
    // Nur JSON-Dateien im Content-Verzeichnis
    if (!relativePath.startsWith(options.contentDir)) return
    if (!relativePath.endsWith('.json')) return

    const contentType = resolveContentType(relativePath, options.contentDir)
    if (!contentType) return

    // HMR-Event über Nuxt DevTools / WebSocket senden
    nuxt.callHook('openpress:content-change', {
      event,          // 'add' | 'change' | 'unlink'
      path: relativePath,
      contentType,    // { type: 'page', slug: 'about' } | { type: 'site' } | { type: 'navigation' }
      timestamp: Date.now()
    })
  })
}
```

#### 3.2.2 Content-Type Resolution

```typescript
// packages/core/src/runtime/server/utils/content-type.ts

interface ContentChangePayload {
  event: 'add' | 'change' | 'unlink'
  path: string
  contentType: ContentType
  timestamp: number
}

type ContentType =
  | { type: 'page'; slug: string }
  | { type: 'site' }
  | { type: 'navigation' }

function resolveContentType(relativePath: string, contentDir: string): ContentType | null {
  const normalized = relativePath
    .replace(contentDir + '/', '')
    .replace(/\\/g, '/')

  // content/pages/about.json → { type: 'page', slug: 'about' }
  // content/pages/blog/my-post.json → { type: 'page', slug: 'blog/my-post' }
  if (normalized.startsWith('pages/') && normalized.endsWith('.json')) {
    const slug = normalized
      .replace('pages/', '')
      .replace('.json', '')
    return { type: 'page', slug }
  }

  // content/site.json → { type: 'site' }
  if (normalized === 'site.json') {
    return { type: 'site' }
  }

  // content/navigation.json → { type: 'navigation' }
  if (normalized === 'navigation.json') {
    return { type: 'navigation' }
  }

  return null
}
```

### 3.3 WebSocket-Brücke (Dev-Only)

#### 3.3.1 Server: Event an Vite HMR WebSocket

Nuxt/Vite stellt bereits einen WebSocket für HMR bereit. Wir nutzen diesen Kanal:

```typescript
// In module.ts setup() - Dev-Only:
nuxt.hook('openpress:content-change', (payload: ContentChangePayload) => {
  // Vite HMR WebSocket nutzen
  nuxt.hook('vite:serverCreated', (viteServer) => {
    viteServer.ws.send({
      type: 'custom',
      event: 'openpress:content-change',
      data: payload
    })
  })
})
```

**Alternativ-Ansatz via Nitro WebSocket:**

Falls der Vite-WS nicht verfügbar ist (z.B. in bestimmten Build-Modi), wird ein
dedizierter Nitro WebSocket-Handler als Fallback eingesetzt:

```typescript
// runtime/server/routes/_openpress/ws.ts
export default defineWebSocketHandler({
  open(peer) {
    peer.subscribe('openpress:content')
  },
  message(peer, message) {
    // Client → Server Messages (z.B. Subscription-Filter)
  }
})
```

#### 3.3.2 Client: HMR Event Handler

```typescript
// runtime/plugins/openpress-hmr.client.ts (Dev-Only Plugin)

export default defineNuxtPlugin(() => {
  if (!import.meta.hot) return

  import.meta.hot.on('openpress:content-change', (payload: ContentChangePayload) => {
    handleContentChange(payload)
  })
})

async function handleContentChange(payload: ContentChangePayload) {
  const { contentType, event } = payload

  switch (contentType.type) {
    case 'page':
      await refreshPage(contentType.slug, event)
      break
    case 'site':
      await refreshSiteConfig()
      break
    case 'navigation':
      await refreshNavigation()
      break
  }
}
```

### 3.4 Client-Side: Reactive State Invalidation

#### 3.4.1 Page-Refresh ohne Reload

```typescript
// runtime/composables/usePage.ts

export function usePage(slug: MaybeRef<string>) {
  const resolvedSlug = toRef(slug)

  const { data, refresh, status } = useFetch(
    () => `/api/_openpress/pages/${resolvedSlug.value}`,
    {
      key: `openpress-page-${resolvedSlug.value}`,
      // Wichtig: watch slug für reaktive Slug-Änderungen
      watch: [resolvedSlug]
    }
  )

  return { page: data, refresh, status }
}
```

Die HMR-Integration ruft `refresh()` auf dem entsprechenden `useFetch`-Key auf:

```typescript
// runtime/composables/useContentRefresh.ts

export function useContentRefresh() {
  async function refreshPage(slug: string, event: string) {
    if (event === 'unlink') {
      // Seite gelöscht - zur Übersicht navigieren
      await navigateTo('/_edit')
      return
    }

    // useFetch-Cache für diese Page invalidieren
    await refreshNuxtData(`openpress-page-${slug}`)
  }

  async function refreshSiteConfig() {
    await refreshNuxtData('openpress-site')
  }

  async function refreshNavigation() {
    await refreshNuxtData('openpress-navigation')
  }

  return { refreshPage, refreshSiteConfig, refreshNavigation }
}
```

**Mechanismus:** `refreshNuxtData(key)` invalidiert den Cache von `useFetch` mit dem
entsprechenden Key und triggert einen neuen Fetch. Vue's Reaktivitätssystem rendert
die betroffenen Komponenten automatisch neu.

### 3.5 StorageEngine Cache-Invalidierung

Die StorageEngine liest bei jedem `readPage()` vom Dateisystem - es gibt keinen
internen Cache. Daher ist **keine serverseitige Cache-Invalidierung nötig**.

Sollte in Zukunft ein Server-Cache eingeführt werden (Performance), muss dieser
im `builder:watch` Handler ebenfalls invalidiert werden:

```typescript
nuxt.hook('openpress:content-change', async (payload) => {
  // Zukünftig: Server-Cache invalidieren
  // const engine = await useStorageEngine()
  // engine.invalidateCache(payload.contentType)
})
```

### 3.6 Dev-Only Scoping

Alle HMR-Komponenten sind ausschließlich im Development-Modus aktiv:

```typescript
// module.ts
if (nuxt.options.dev) {
  // File-Watcher Hook registrieren
  // HMR Client-Plugin injizieren
  addPlugin({
    src: resolver.resolve('./runtime/plugins/openpress-hmr.client'),
    mode: 'client'
  })
}
```

**Begründung:**
- In Production gibt es keinen File-Watcher
- HMR-Code wird nicht in den Production-Build aufgenommen
- Der Editor kommuniziert in Production über die REST-API (POST → re-fetch)

## 4. Szenarien

### 4.1 Szenario: Editor speichert Page

```
1. User klickt "Speichern" im Editor
2. Client: PUT /api/_openpress/pages/about
3. Server: writePage() → content/pages/about.json wird geschrieben
4. Server: Auto-Commit (wenn aktiviert)
5. File-Watcher: Erkennt Änderung an about.json
6. Server: builder:watch → openpress:content-change Event
7. Server: WebSocket-Event an Client
8. Client: refreshNuxtData('openpress-page-about')
9. Client: useFetch holt neue Daten
10. Vue: Re-Render der betroffenen Komponenten
```

**Wichtig:** Schritt 8-10 sind ein Fallback/Confirmation-Mechanismus. Der Editor hat
die Daten bereits lokal (aus dem PUT-Response). Der HMR-Refresh stellt sicher, dass
der angezeigte Content mit dem Dateisystem synchron ist.

### 4.2 Szenario: Externe Bearbeitung (VS Code)

```
1. Developer öffnet content/pages/about.json in VS Code
2. Developer ändert den Titel und speichert
3. File-Watcher: Erkennt Änderung
4. Server: builder:watch → openpress:content-change Event
5. Server: WebSocket-Event an Client
6. Client: refreshNuxtData('openpress-page-about')
7. Browser zeigt aktualisierten Titel (kein Reload nötig)
```

### 4.3 Szenario: Neue Page erstellt

```
1. File-Watcher: 'add' Event für content/pages/new-page.json
2. Server: openpress:content-change { event: 'add', type: 'page', slug: 'new-page' }
3. Client: Page-Liste invalidieren
4. Editor-Sidebar zeigt neue Seite
```

### 4.4 Szenario: Page gelöscht

```
1. File-Watcher: 'unlink' Event für content/pages/old-page.json
2. Server: openpress:content-change { event: 'unlink', type: 'page', slug: 'old-page' }
3. Client: Wenn aktuell auf /_edit/old-page → navigateTo('/_edit')
4. Client: Page-Liste invalidieren
```

## 5. Edge Cases

### 5.1 Rapid File Changes (Debouncing)

Wenn ein Editor viele Änderungen schnell hintereinander speichert:

```typescript
// In module.ts:
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const pendingChanges = new Map<string, ContentChangePayload>()

nuxt.hook('builder:watch', async (event, relativePath) => {
  // ... Content-Type Resolution ...

  // Änderung merken (überschreibt vorherige für gleiche Datei)
  pendingChanges.set(relativePath, payload)

  // Debounce: 100ms warten, dann alle gesammelten Änderungen senden
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    for (const change of pendingChanges.values()) {
      nuxt.callHook('openpress:content-change', change)
    }
    pendingChanges.clear()
  }, 100)
})
```

**100ms Debounce** - Schnell genug für flüssiges Feedback, vermeidet aber Überlastung
bei Batch-Operations (z.B. `git checkout` ändert viele Dateien gleichzeitig).

### 5.2 Ungültige JSON-Dateien

Wenn eine JSON-Datei syntaktisch kaputt ist (z.B. während des Tippens in VS Code):

```typescript
async function refreshPage(slug: string, event: string) {
  try {
    await refreshNuxtData(`openpress-page-${slug}`)
  } catch (error) {
    // API gibt 422/500 zurück - kein Crash
    // Editor zeigt Fehlerstatus, behält letzte gültige Daten
    console.warn(`[OpenPress HMR] Failed to refresh '${slug}':`, error)
  }
}
```

**Verhalten:** Der Client behält die letzten gültigen Daten. Sobald die Datei wieder
valide ist, wird der nächste File-Watch-Event den Refresh erneut triggern.

### 5.3 Initiale Content-Erstellung

Beim ersten Start existiert möglicherweise noch kein `content/`-Verzeichnis:

```typescript
// module.ts setup():
if (nuxt.options.dev) {
  const contentDir = resolver.resolve(nuxt.options.rootDir, options.contentDir)

  // Verzeichnis erstellen falls nicht vorhanden (StorageEngine.init() macht das auch)
  await mkdir(contentDir, { recursive: true })

  nuxt.options.watch.push(contentDir)
}
```

## 6. Performance-Betrachtungen

| Aspekt | Ansatz |
|--------|--------|
| Watcher-Overhead | Nutzt Nuxt's eingebauten Watcher (Chokidar) - kein zusätzlicher Process |
| Debouncing | 100ms Sammelfenster für Batch-Changes |
| Netzwerk | Nur geänderte Daten werden re-fetched (kein Full-State-Sync) |
| Re-Render | Vue's Reaktivität rendert nur betroffene Komponenten neu |
| Dateisystem-Reads | StorageEngine liest on-demand, kein Memory-Cache (einfach, korrekt) |

## 7. Abhängigkeiten

| Paket | Zweck |
|-------|-------|
| `vite` | HMR WebSocket (`import.meta.hot`) |
| `nuxt` | `builder:watch` Hook, `refreshNuxtData()` |
| `@openpress/schemas` | ContentChangePayload Types |
| Chokidar (via Nuxt) | File-System Watcher |

## 8. Testplan

### 8.1 Unit Tests

| Test | Beschreibung |
|------|-------------|
| `resolveContentType` | Korrekte Zuordnung von Pfaden zu Content-Types |
| Slug-Extraktion | `pages/about.json` → `about`, `pages/blog/post.json` → `blog/post` |
| Ignorierte Pfade | Nicht-JSON-Dateien, Dateien außerhalb von `content/` |
| Debounce-Logik | Mehrere schnelle Änderungen werden gebündelt |

### 8.2 Integration Tests

| Test | Beschreibung |
|------|-------------|
| Page-Änderung | JSON-Datei ändern → Client erhält Update |
| Site-Config-Änderung | `site.json` ändern → Config wird aktualisiert |
| Navigation-Änderung | `navigation.json` ändern → Menü aktualisiert |
| Neue Datei | Page-JSON erstellen → Erscheint in der Liste |
| Datei löschen | Page-JSON löschen → Editor navigiert weg |
| Ungültige JSON | Kaputte Datei → Kein Crash, letzte Daten bleiben |

### 8.3 Test-Approach

```typescript
import { setup, useTestContext } from '@nuxt/test-utils'
import { writeFile, unlink } from 'fs/promises'

describe('HMR Integration', () => {
  await setup({ dev: true, rootDir: '...' })

  it('detects page changes', async () => {
    const ctx = useTestContext()

    // Page-Datei ändern
    await writeFile('content/pages/test.json', JSON.stringify(testPage))

    // Warten auf WebSocket-Event
    // Verifizieren, dass Content aktualisiert wurde
  })
})
```

## 9. Akzeptanzkriterien

- [ ] JSON-Änderungen in `content/` werden im Dev-Modus erkannt
- [ ] Page-Änderungen aktualisieren die Vorschau ohne Full-Page-Reload
- [ ] Site-Config-Änderungen werden sofort reflektiert
- [ ] Navigation-Änderungen aktualisieren das Menü live
- [ ] Neue Pages erscheinen automatisch in der Editor-Sidebar
- [ ] Gelöschte Pages lösen Navigation zum Dashboard aus
- [ ] Ungültige JSON-Dateien verursachen keinen Crash
- [ ] Schnelle aufeinanderfolgende Änderungen werden gedebounced
- [ ] HMR-Code ist nicht im Production-Build enthalten
- [ ] Externe Bearbeitung (VS Code) triggert den gleichen Refresh
