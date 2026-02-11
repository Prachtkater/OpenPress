# @openpress/core

Der zentrale Kern von OpenPress — ein Nuxt 3 Module, das In-Context-Editing mit Git-basiertem
Content-Storage vereint.

## Inhaltsverzeichnis

- [Modul-Architektur](#modul-architektur)
- [Verzeichnisstruktur](#verzeichnisstruktur)
- [Einstiegspunkt: `src/module.ts`](#einstiegspunkt-srcmodulets)
- [Git-Storage API](#git-storage-api)
- [Server API-Routes](#server-api-routes)
- [HMR-Logik (Hot Module Replacement)](#hmr-logik-hot-module-replacement)
- [OpEditFrame & Glow-Frame UI](#opeditframe--glow-frame-ui)
- [Composition System (Op-Komponenten)](#composition-system-op-komponenten)
- [Composables](#composables)
- [Feature-Discovery-System](#feature-discovery-system)
- [Playground-Integration](#playground-integration)
- [Neue API-Route hinzufuegen](#neue-api-route-hinzufuegen)
- [Konfiguration](#konfiguration)
- [Tests](#tests)

---

## Modul-Architektur

`@openpress/core` ist als **Nuxt 3 Module** implementiert und folgt dem offiziellen
`defineNuxtModule`-Pattern. Das Modul registriert sich ueber den Config-Key `openpress`
und stellt alle Runtime-Bestandteile (Komponenten, Composables, Server-Routes, Pages) automatisch
bereit.

**Architektur-Ueberblick:**

```
┌─────────────────────────────────────────────────────────┐
│                    Nuxt Application                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │              @openpress/core Module               │  │
│  │                                                   │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────────┐  │  │
│  │  │  Pages   │  │Components│  │   Composables   │  │  │
│  │  │ /_edit/* │  │ Op*      │  │ useOpenPress    │  │  │
│  │  └────┬─────┘  └────┬─────┘  │ useEditor      │  │  │
│  │       │              │        │ useContentSync  │  │  │
│  │       ▼              ▼        └────────┬────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │            Server API Routes                 │  │  │
│  │  │          /api/_openpress/*                    │  │  │
│  │  └────────────────────┬─────────────────────────┘  │  │
│  │                       ▼                            │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │            StorageEngine                     │  │  │
│  │  │   File I/O (Bun.file/Bun.write)             │  │  │
│  │  │   + Zod-Validierung                         │  │  │
│  │  │   + GitOps (Bun.spawn(['git', ...]))         │  │  │
│  │  └──────────────────────┬───────────────────────┘  │  │
│  │                         ▼                          │  │
│  │                   ./content/                       │  │
│  │               (JSON-Dateien + Git)                 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Verzeichnisstruktur

```
packages/core/
  src/
    module.ts                          # Nuxt Module Einstiegspunkt
    module.test.ts                     # Module-Integration-Tests
    hmr/
      types.ts                         # ContentChangePayload, ContentType
      resolve-content-type.ts          # Pfad → ContentType Mapping
      debounce-changes.ts              # Batched file-change Debouncer
      index.ts                         # Re-Exports
    features/
      discover.ts                      # Feature-Manifest-Discovery
      registry.ts                      # In-Memory Feature-Registry
      index.ts                         # Re-Exports
    runtime/
      components/
        OpSection.vue                  # Sektion-Wrapper
        OpSlot.vue                     # Slot-Container
        OpBlock.vue                    # Block-Wrapper
        OpEditFrame.vue                # Glow-Frame Overlay-Editor
        OpInlineEdit.vue               # Tiptap Inline-Rich-Text Editor
        OpBlockToolbar.vue             # Floating Block-Toolbar
        OpTreeNode.vue                 # Rekursiver Seitenbaum-Knoten
      composables/
        useOpenPress.ts                # Globaler Edit-Mode State
        useEditor.ts                   # Element-Selektion & Hover-State
        usePage.ts                     # Einzelne Seite laden (useAsyncData)
        usePageTree.ts                 # Seitenbaum CRUD-Operationen
        page-tree.ts                   # buildPageTree() Logik (testbar ohne #imports)
        useContentRefresh.ts           # HMR-getriggerte Cache-Invalidierung
        useContentSync.ts              # Tiptap → API → HMR Save-Loop
        useTiptapBridge.ts             # Tiptap ↔ Op-System Bridge
        useBlockToolbar.ts             # Floating Toolbar State & Actions
        useFeatures.ts                 # Feature-API Client
      plugins/
        openpress.client.ts            # Client Plugin (Editor Init)
        openpress-hmr.client.ts        # Dev-only HMR WebSocket Listener
      pages/
        _edit/
          index.vue                    # Site Map Dashboard (/_edit)
          [slug].vue                   # Page Editor (/_edit/:slug)
      server/
        lib/storage-engine/
          storage-engine.ts            # StorageEngine Klasse
          file-io.ts                   # readJSON, writeJSON, deleteFile, listJSONFiles
          git.ts                       # GitOps Klasse (Bun.spawn)
          index.ts                     # Re-Exports
        utils/
          storage.ts                   # useStorageEngine() Singleton
        api/
          pages/
            index.get.ts               # GET    /api/_openpress/pages
            index.post.ts              # POST   /api/_openpress/pages
            [slug].get.ts              # GET    /api/_openpress/pages/:slug
            [slug].put.ts              # PUT    /api/_openpress/pages/:slug
            [slug].delete.ts           # DELETE /api/_openpress/pages/:slug
          site.get.ts                  # GET    /api/_openpress/site
          site.put.ts                  # PUT    /api/_openpress/site
          navigation.get.ts            # GET    /api/_openpress/navigation
          navigation.put.ts            # PUT    /api/_openpress/navigation
          git/
            commit.post.ts             # POST   /api/_openpress/git/commit
            history.get.ts             # GET    /api/_openpress/git/history
            status.get.ts              # GET    /api/_openpress/git/status
          features.get.ts              # GET    /api/_openpress/features
```

---

## Einstiegspunkt: `src/module.ts`

Das Modul wird ueber `defineNuxtModule<OpenPressOptions>()` definiert und fuehrt beim
`setup()` die folgenden Schritte in Reihenfolge aus:

### 1. Komponenten-Registrierung

```ts
addComponentsDir({
  path: resolver.resolve('./runtime/components'),
  prefix: 'Op',
  global: true,
})
```

Alle Vue-Komponenten in `runtime/components/` werden global als `Op*`-Komponenten registriert
(z.B. `OpSection`, `OpEditFrame`).

### 2. Auto-Import Composables

```ts
addImportsDir(resolver.resolve('./runtime/composables'))
```

Alle Composables (z.B. `useOpenPress`, `useEditor`) stehen automatisch ohne expliziten Import
zur Verfuegung.

### 3. Client-Plugins

- **`openpress.client.ts`** — Initialisierung der Editor-Runtime (nur Client)
- **`openpress-hmr.client.ts`** — Dev-only Plugin fuer WebSocket-basierte Content-HMR

### 4. Editor-Pages (`/_edit`)

Ueber den `pages:extend`-Hook werden zwei Routen registriert:

| Route | Seite | Beschreibung |
|---|---|---|
| `/_edit` | `index.vue` | Site Map Dashboard (Seitenbaum mit CRUD) |
| `/_edit/:slug(.*)` | `[slug].vue` | Page Editor mit OpEditFrame |

Der `editPath` ist konfigurierbar (Default: `/_edit`).

### 5. Server API-Routes

Alle API-Routes werden ueber `addServerHandler()` registriert (siehe
[Server API-Routes](#server-api-routes)).

### 6. HMR-Setup (nur Dev)

Im Dev-Modus wird ein File-Watcher mit Debouncing registriert, der JSON-Aenderungen im
Content-Verzeichnis erkennt und per Vite WebSocket an den Client weiterleitet (siehe
[HMR-Logik](#hmr-logik-hot-module-replacement)).

### 7. Feature-Discovery

Beim Start werden alle in `nuxt.config.ts` aufgefuehrten Module nach
`openpress.feature.json`-Manifest-Dateien durchsucht (siehe
[Feature-Discovery-System](#feature-discovery-system)).

### 8. Runtime-Config

Das Modul injiziert Konfiguration in Nuxts Runtime-Config:

```ts
// Oeffentlich (Client-seitig verfuegbar)
runtimeConfig.public.openpress = {
  editPath: '/_edit',
}

// Privat (nur Server-seitig)
runtimeConfig.openpress = {
  contentDir: '/absolute/path/to/content',
  repoRoot: '/absolute/path/to/repo',
  autoCommit: true,
}
```

### Modul-Optionen

```ts
interface OpenPressOptions {
  /** Pfad zum Content-Verzeichnis (Default: './content') */
  contentDir: string
  /** URL-Prefix fuer den Editor (Default: '/_edit') */
  editPath: string
  /** Storage Engine Konfiguration */
  storage: {
    /** Git-Repository-Root (Default: Nuxt rootDir) */
    repoRoot?: string
    /** Automatische Commits bei Content-Aenderungen (Default: true) */
    autoCommit: boolean
  }
}
```

---

## Git-Storage API

Die Storage-Schicht besteht aus drei Ebenen:

### `StorageEngine` (storage-engine.ts)

Die zentrale Klasse, die File-I/O und Git-Operationen kapselt:

```ts
const engine = new StorageEngine({
  contentDir: '/path/to/content',
  repoRoot: '/path/to/repo',
})
await engine.init() // Erstellt Verzeichnisse, initialisiert Git

// Pages
await engine.listPages()                // → PageListItem[]
await engine.readPage('about')          // → Page
await engine.writePage('about', page)   // Schreibt + validiert
await engine.deletePage('about')        // Loescht Datei
await engine.pageExists('about')        // → boolean

// Site Config
await engine.readSiteConfig()           // → SiteConfig
await engine.writeSiteConfig(config)    // Schreibt + validiert

// Navigation
await engine.readNavigation()           // → Navigation
await engine.writeNavigation(nav)       // Schreibt + validiert

// Git
await engine.commit('my message')       // Stage + Commit → { hash, message }
await engine.getHistory('about')        // Commit-Log fuer Seite
await engine.hasChanges()               // → boolean (git status --porcelain)
```

**Dateisystem-Layout:**
```
content/
  site.json                 # SiteConfig
  navigation.json           # Navigation
  pages/
    index.json              # Startseite
    about.json              # /about
    blog/
      my-post.json          # /blog/my-post (verschachtelte Slugs)
```

### `FileIO` (file-io.ts)

Low-Level Datei-Operationen mit Zod-Validierung:

- **`readJSON<T>(path, schema)`** — Liest JSON, validiert gegen Zod-Schema, gibt `T` zurueck
- **`writeJSON<T>(path, data, schema)`** — Validiert, serialisiert als formatiertes JSON, schreibt via `Bun.write()`
- **`deleteFile(path)`** — Loescht Datei (ignoriert ENOENT)
- **`listJSONFiles(dir)`** — Listet alle `.json`-Dateien in einem Verzeichnis
- **`fileExists(path)`** — Prueft Existenz via `Bun.file().exists()`

Custom Error-Klassen: `FileIOError` (I/O-Fehler) und `ValidationError` (Zod-Validierung).

### `GitOps` (git.ts)

Git-Operationen via `Bun.spawn(['git', ...])` — keine externe Bibliothek noetig:

```ts
const git = new GitOps('/path/to/repo')

await git.init()              // git init (falls noetig)
await git.add(['file.json'])  // git add <files>
await git.addAll('./content') // git add -A <dir>
await git.commit('message')   // git commit → { hash, message }
await git.hasChanges()        // git status --porcelain → boolean
await git.log('path', 20)     // git log → CommitLogEntry[]
```

### Singleton-Zugriff (Server-seitig)

```ts
// In einem Server API-Handler:
import { useStorageEngine } from '../utils/storage'

export default defineEventHandler(async () => {
  const engine = await useStorageEngine()
  // engine ist ein Singleton, initialisiert aus runtimeConfig
  return await engine.listPages()
})
```

---

## Server API-Routes

Alle API-Endpoints laufen unter `/api/_openpress/`:

### Pages CRUD

| Methode | Route | Beschreibung | Body | Response |
|---|---|---|---|---|
| GET | `/api/_openpress/pages` | Alle Seiten auflisten | — | `PageListItem[]` |
| POST | `/api/_openpress/pages` | Neue Seite erstellen | `Page` (Zod-validiert) | `Page` (201) |
| GET | `/api/_openpress/pages/:slug` | Einzelne Seite laden | — | `Page` |
| PUT | `/api/_openpress/pages/:slug` | Seite aktualisieren | `Page` (Zod-validiert) | `Page` |
| DELETE | `/api/_openpress/pages/:slug` | Seite loeschen | — | 204 |

POST und PUT validieren den Body gegen `PageSchema` (Zod) und geben 422 bei Validierungsfehlern
zurueck. Bei aktiviertem `autoCommit` wird nach jeder Schreib-/Loeschoperation automatisch ein
Git-Commit erzeugt.

### Site Config & Navigation

| Methode | Route | Beschreibung |
|---|---|---|
| GET | `/api/_openpress/site` | Site-Konfiguration laden |
| PUT | `/api/_openpress/site` | Site-Konfiguration speichern |
| GET | `/api/_openpress/navigation` | Navigation laden |
| PUT | `/api/_openpress/navigation` | Navigation speichern |

### Git-Operationen

| Methode | Route | Beschreibung | Body |
|---|---|---|---|
| POST | `/api/_openpress/git/commit` | Manueller Commit | `{ message: string }` |
| GET | `/api/_openpress/git/history` | Commit-History | — |
| GET | `/api/_openpress/git/status` | Change-Status | — |

### Features

| Methode | Route | Beschreibung |
|---|---|---|
| GET | `/api/_openpress/features` | Alle registrierten Features mit Blocks/Panels |

---

## HMR-Logik (Hot Module Replacement)

Die HMR-Logik sorgt dafuer, dass Content-Aenderungen im Dev-Modus sofort in der Vorschau
sichtbar werden — ohne manuellen Page-Reload.

### Architektur-Flow

```
JSON-Datei geaendert
       │
       ▼
  Nuxt builder:watch Hook
       │
       ▼
  resolveContentType()          ← Pfad → { type: 'page', slug } | 'site' | 'navigation'
       │
       ▼
  createChangeDebouncer()       ← Batched Changes (100ms Fenster)
       │
       ▼
  Vite WebSocket                ← Event: 'openpress:content-change'
       │
       ▼
  openpress-hmr.client.ts      ← Plugin: import.meta.hot.on(...)
       │
       ▼
  useContentRefresh()           ← Selektive Cache-Invalidierung via refreshNuxtData()
```

### Beteiligte Module

**`resolveContentType(relativePath, contentDir)`** (`hmr/resolve-content-type.ts`)

Mappt Dateipfade auf Content-Typen:

```ts
resolveContentType('content/pages/about.json', './content')
// → { type: 'page', slug: 'about' }

resolveContentType('content/site.json', './content')
// → { type: 'site' }

resolveContentType('content/navigation.json', './content')
// → { type: 'navigation' }

resolveContentType('styles/main.css', './content')
// → null (nicht im Content-Verzeichnis)
```

**`createChangeDebouncer(onFlush, delay?)`** (`hmr/debounce-changes.ts`)

Sammelt schnell aufeinanderfolgende File-Changes und flusht sie gebatched:

- Spaetere Aenderungen am gleichen Pfad ueberschreiben fruehere (Map-basiert)
- Default-Delay: 100ms
- `add(payload)` — Change hinzufuegen
- `flush()` — Sofort flushen
- `dispose()` — Timer aufraemen

**`openpress-hmr.client.ts`** (Dev-only Plugin)

Registriert einen Listener auf dem Vite HMR WebSocket:

```ts
import.meta.hot.on('openpress:content-change', (payload) => {
  handleChange(payload) // → useContentRefresh()
})
```

**`useContentRefresh()`** (Composable)

Fuehrt selektive Cache-Invalidierung durch:

- **Page geaendert** → `refreshNuxtData('openpress:page:${slug}')`
- **Page geloescht** → Navigation zum Dashboard (`/_edit`)
- **Site Config** → `refreshNuxtData('openpress:site')`
- **Navigation** → `refreshNuxtData('openpress:navigation')`

---

## OpEditFrame & Glow-Frame UI

`OpEditFrame` ist die zentrale Editor-Komponente — der **"Glow Frame"**. Sie umhuellt den
gerenderten Content und bietet In-Context-Editing-Funktionalitaet.

### Modi

- **Preview-Modus** — Rendert Content ohne Dekoration. Toggle-Button unten rechts sichtbar.
- **Edit-Modus** — Hover/Click-Interaktion aktiviert. Glow-Overlays und Toolbar werden angezeigt.

### Glow-Overlay-System

Im Edit-Modus verwendet der OpEditFrame zwei Overlay-Divs, die absolut positioniert ueber
dem gerade gehighlighteten Element liegen:

- **Hover Glow** — 1px blaue Outline (`rgba(59, 130, 246, 0.5)`) beim Mouse-Over
- **Selection Glow** — 2px leuchtende Outline mit Box-Shadow bei Klick-Selektion

Die Positionierung berechnet sich relativ zum Frame-Container via `getBoundingClientRect()` und
aktualisiert sich bei Scroll und Resize (via `ResizeObserver`).

### Element-Erkennung (`findOpElement`)

Der Frame traversiert das DOM aufwaerts ab `event.target` und sucht nach `data-op-id`-Attributen
mit optionalen Typ-Attributen (`data-op-block`, `data-op-slot`, `data-op-section`).
Prioritaet: Block > Slot > Section.

### Keyboard-Interaktion

- **Escape** — Inline-Editing deaktivieren (falls aktiv), sonst Selektion aufheben

### Floating Block-Toolbar (`OpBlockToolbar`)

Erscheint oberhalb des selektierten Elements und bietet Standard-Aktionen:

- Move Up / Move Down / Delete
- Erweiterbar ueber `useBlockToolbar().registerActions()` (fuer Features/Plugins)

### Tiptap Inline-Editing (`OpInlineEdit`)

Rendert einen Tiptap-Editor fuer Rich-Text-Bloecke:

1. **Doppelklick** auf einen Block → Aktiviert den Tiptap-Editor (`setEditable(true)`)
2. **Tippen** → Aenderungen werden ueber `useTiptapBridge.emitContentUpdate()` dispatched
3. **Blur/Escape** → Editor wird deaktiviert

### Integration in den Playground

Der Playground (`playground/nuxt.config.ts`) bindet das Core-Modul ein:

```ts
// playground/nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@openpress/core'],

  openpress: {
    contentDir: './content',
    editPath: '/_edit',
    storage: {
      autoCommit: false,  // Im Dev-Modus kein Auto-Commit
    },
  },
})
```

Um den Editor zu verwenden, wird `OpEditFrame` in einem Layout oder einer Seite platziert:

```vue
<template>
  <OpEditFrame>
    <!-- Page-Content wird hier gerendert -->
    <OpSection v-for="section in page.sections" :key="section.id">
      <OpSlot v-for="(blocks, slotName) in section.slots" :key="slotName">
        <OpBlock v-for="block in blocks" :key="block.id">
          <OpInlineEdit
            :block-id="block.id"
            :section-id="section.id"
            :slot-name="slotName"
            :content="block.props.content"
          />
        </OpBlock>
      </OpSlot>
    </OpSection>
  </OpEditFrame>
</template>
```

Der Save-Zyklus (Edit → Save → Preview) laeuft vollautomatisch:

```
OpInlineEdit (Tiptap onUpdate)
  → useTiptapBridge.emitContentUpdate()
    → useContentSync.handleContentUpdate()
      → Debounced PUT /api/_openpress/pages/:slug
        → StorageEngine.writePage() + auto-commit
          → JSON-Datei geschrieben
            → Vite Watcher → HMR WebSocket
              → useContentRefresh() → refreshNuxtData()
```

---

## Composition System (Op-Komponenten)

Alle Komponenten werden global mit dem `Op`-Prefix registriert:

| Komponente | Beschreibung |
|---|---|
| `OpSection` | Sektion-Wrapper (`<section class="op-section">`) |
| `OpSlot` | Slot-Container (`<div class="op-slot">`) |
| `OpBlock` | Block-Wrapper (`<div class="op-block">`) |
| `OpEditFrame` | Glow-Frame Editor-Overlay |
| `OpInlineEdit` | Tiptap Inline-Rich-Text Editor |
| `OpBlockToolbar` | Floating Toolbar ueber selektierten Bloecken |
| `OpTreeNode` | Rekursiver Knoten fuer den Seitenbaum |

Alle Op-Elemente muessen `data-op-id` und ein Typ-Attribut (`data-op-block`, `data-op-slot`,
`data-op-section`) setzen, damit der OpEditFrame sie erkennen und interagieren kann.

---

## Composables

### `useOpenPress()`

Globaler Edit-Mode State:

```ts
const { editMode } = useOpenPress()
editMode.value = true  // Aktiviert den Edit-Modus
```

### `useEditor()`

Element-Selektion, Hover-State, Inline-Editing-Flag:

```ts
const {
  isDirty,            // Ungespeicherte Aenderungen vorhanden
  selectedBlockId,    // ID des selektierten Blocks
  selectedElement,    // { id, type: 'block'|'slot'|'section' }
  hoveredElement,     // { id, type }
  inlineEditing,      // Tiptap-Editor aktiv
  selectElement,      // (id, type) => void
  clearSelection,
  hoverElement,
  clearHover,
  setInlineEditing,
} = useEditor()
```

### `usePage(slug)`

Laedt eine einzelne Seite via `useAsyncData`:

```ts
const { data: page, pending, error } = usePage('about')
```

### `usePageTree()`

Seitenbaum mit CRUD-Operationen fuer das Site Map Dashboard:

```ts
const {
  tree,               // PageTreeNode[] (hierarchisch)
  isLoading, error,
  loadPages,          // API-Fetch + Tree-Build
  createPage,         // (slug, title) => boolean
  deletePage,         // (slug) => boolean
  renamePage,         // (oldSlug, newTitle, newSlug?) => boolean
  toggleNode,         // Expand/Collapse
  openPage,           // Navigation zu /_edit/:slug
} = usePageTree()
```

### `useContentSync(options?)`

Breidet Tiptap-Edits zum Server und loest den HMR-Zyklus aus:

```ts
const sync = useContentSync({ debounceMs: 1000 })
sync.setPage(page)    // Aktuelle Page-Daten setzen
const stop = sync.start()  // Listener registrieren
await sync.flush()    // Sofort speichern (vor Navigation)
stop()                // Cleanup
```

### `useTiptapBridge()`

Bridge zwischen Tiptap-Editoren und dem Op-System:

```ts
const {
  activateBlock,      // (blockId, sectionId, slotName)
  deactivateBlock,
  isBlockActive,      // (blockId) => boolean
  onContentUpdate,    // (handler) => unregister
  emitContentUpdate,  // (editor) => void
  getInitialContent,  // (props) => JSONContent | string
} = useTiptapBridge()
```

### `useBlockToolbar()`

State und Positioning fuer die Floating Block-Toolbar:

```ts
const {
  context,            // ToolbarContext | null
  show, hide, isVisible,
  getToolbarPosition,
  registerActions,    // Eigene Actions registrieren (fuer Features)
  getDefaultActions,  // Move Up / Move Down / Delete
} = useBlockToolbar()
```

### `useFeatures()` / `useComponentPicker()`

Zugriff auf registrierte Features und verfuegbare Block-Typen:

```ts
const { data: features } = useFeatures()
const { data: blocks } = useComponentPicker()
```

---

## Feature-Discovery-System

OpenPress entdeckt automatisch Feature-Pakete, die ein `openpress.feature.json` Manifest
in ihrem Package-Root enthalten.

### Discovery-Flow

1. Beim Module-Setup werden alle Nuxt-Module aus `nuxt.config.ts` extrahiert
2. Fuer jedes Modul wird `node_modules/<name>/openpress.feature.json` gesucht
3. Gefundene Manifeste werden gegen `FeatureManifestSchema` (Zod) validiert
4. Gueltige Features werden in der In-Memory-Registry registriert
5. Feature-Daten stehen ueber `/api/_openpress/features` und `runtimeConfig` bereit

### Feature-Registry

```ts
import { getRegisteredFeatures, getComponentPickerEntries } from './features'

getRegisteredFeatures()      // → RegisteredFeature[]
getComponentPickerEntries()  // → ComponentPickerEntry[] (fuer den Block-Picker)
getEditorPanels()            // → FeatureEditorPanel[] (fuer Editor-UI)
```

### Eigenes Feature erstellen

1. Erstelle ein Paket `@openpress/feature-*`
2. Lege `openpress.feature.json` im Package-Root an:

```json
{
  "name": "my-feature",
  "label": "My Feature",
  "description": "Beschreibung",
  "blocks": [
    {
      "type": "my-block",
      "label": "My Block",
      "category": "content",
      "defaultProps": { "text": "Hello" }
    }
  ],
  "editorPanels": [],
  "editorRoutes": []
}
```

3. Registriere das Paket als Nuxt-Modul in `nuxt.config.ts`:

```ts
modules: ['@openpress/core', '@openpress/feature-my-feature']
```

---

## Playground-Integration

Der Playground (`playground/`) dient als Entwicklungsumgebung:

```bash
# Aus dem Core-Paket:
bun run dev

# Oder direkt:
cd playground && nuxi dev
```

Die `nuxt.config.ts` des Playgrounds registriert `@openpress/core` als Modul und konfiguriert
die Storage-Optionen. Content wird in `playground/content/` als JSON-Dateien gespeichert.

Der Editor ist unter `http://localhost:3000/_edit` erreichbar:

- `/_edit` — Site Map Dashboard (Seitenbaum)
- `/_edit/about` — Page Editor fuer die Seite "about"

---

## Neue API-Route hinzufuegen

Um eine neue Server API-Route zum Core hinzuzufuegen:

### 1. Handler erstellen

Erstelle eine neue Datei in `src/runtime/server/api/`:

```ts
// src/runtime/server/api/my-resource.get.ts
import { defineEventHandler } from 'h3'
import { useStorageEngine } from '../utils/storage'

export default defineEventHandler(async () => {
  const engine = await useStorageEngine()
  // ... Logik
  return { data: 'result' }
})
```

Die Datei-Namenskonvention folgt dem Nitro-Pattern: `<name>.<method>.ts`

### 2. Route im Modul registrieren

In `src/module.ts` die Route zum `apiRoutes`-Array hinzufuegen:

```ts
const apiRoutes = [
  // ... bestehende Routes
  { route: '/api/_openpress/my-resource', handler: './runtime/server/api/my-resource.get' },
]
```

### 3. Zod-Validierung (bei POST/PUT)

Fuer Schreib-Endpunkte den Body gegen ein Zod-Schema validieren:

```ts
import { defineEventHandler, readBody, createError } from 'h3'
import { MySchema } from '@openpress/schemas'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = MySchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      message: 'Validation failed',
      data: result.error.issues,
    })
  }
  // ... mit result.data weiterarbeiten
})
```

### 4. AutoCommit-Logik (optional)

Wenn die Route Content aendert und Git-Commits gewuenscht sind:

```ts
const config = useRuntimeConfig()
if (config.openpress.autoCommit) {
  await engine.commit(`content: update my-resource`)
}
```

---

## Konfiguration

### `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  modules: ['@openpress/core'],

  openpress: {
    // Pfad zum Content-Verzeichnis (relativ zum Nuxt rootDir)
    contentDir: './content',    // Default: './content'

    // URL-Prefix fuer den Editor
    editPath: '/_edit',         // Default: '/_edit'

    // Git-Storage Konfiguration
    storage: {
      // Git-Repository-Root (Default: Nuxt rootDir)
      repoRoot: undefined,

      // Automatische Commits bei Content-Aenderungen
      autoCommit: true,         // Default: true
    },
  },
})
```

### TypeScript-Unterstuetzung

Das Modul erweitert die Nuxt-Runtime-Config-Typen via Module Augmentation:

```ts
declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    openpress: { editPath: string }
  }
  interface RuntimeConfig {
    openpress: { contentDir: string; repoRoot: string; autoCommit: boolean }
    _openpressFeatures: Array<{ manifest: FeatureManifest; packageDir: string }>
  }
}
```

---

## Tests

Tests werden mit Bun Test ausgefuehrt:

```bash
# Alle Core-Tests
cd packages/core && bun test

# Typecheck
bun x tsc --noEmit
```

Getestete Bereiche:

- `hmr/resolve-content-type.test.ts` — Pfad-zu-ContentType Mapping
- `hmr/debounce-changes.test.ts` — Debouncer-Logik
- `module.test.ts` — Module-Setup Integration
- `features/discover.test.ts` — Feature-Discovery
- `features/registry.test.ts` — Feature-Registry CRUD
- `runtime/components/OpEditFrame.test.ts` — Glow-Frame Interaktion
- `runtime/components/OpInlineEdit.test.ts` — Tiptap-Bridge
- `runtime/components/OpBlockToolbar.test.ts` — Toolbar-Positionierung
- `runtime/composables/useContentRefresh.test.ts` — Cache-Invalidierung
- `runtime/composables/useTiptapBridge.test.ts` — Tiptap ↔ Op-Bridge
- `runtime/composables/useBlockToolbar.test.ts` — Toolbar-State
- `runtime/composables/useContentSync.test.ts` — Content-Sync-Loop
- `runtime/composables/usePageTree.test.ts` — Seitenbaum-Logik
- `runtime/plugins/openpress-hmr.client.test.ts` — HMR-Plugin
