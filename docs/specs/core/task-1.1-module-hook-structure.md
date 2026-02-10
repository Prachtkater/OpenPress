# Task 1.1: `module.ts` Hook-Struktur für `/_edit` Routing

**Epic:** 1 - Core Framework & Nuxt Module Logic
**Status:** Spezifikation
**Spezialist:** Agent Core

---

## 1. Ziel

Implementierung des Nuxt-Module-Einstiegspunkts `src/module.ts`, der:
- OpenPress als Nuxt Module registriert
- Das `/_edit` Routing für den Visual Editor bereitstellt
- Runtime-Komponenten, Composables und Server-Utilities injiziert
- Die Konfigurationsbrücke zwischen Nuxt und OpenPress herstellt

## 2. Kontext

OpenPress läuft als Nuxt 3 Module. Der Editor ist unter `/_edit` erreichbar, während die
Website selbst normal gerendert wird. Das Module muss zur Build-Zeit Hooks registrieren,
die das Routing, die Komponenten-Registrierung und die Runtime-Konfiguration steuern.

## 3. Technisches Design

### 3.1 Nuxt Module Definition

```
packages/core/src/module.ts
```

Das Module wird mit `defineNuxtModule()` definiert und nutzt die Nuxt Module API v3.

```typescript
import { defineNuxtModule, addServerHandler, createResolver,
         addComponentsDir, addImportsDir, addPlugin } from '@nuxt/kit'

export interface OpenPressOptions {
  contentDir: string        // Pfad zum Content-Verzeichnis (default: './content')
  editPath: string          // URL-Prefix für Editor (default: '/_edit')
  storage: {
    repoRoot?: string       // Git-Repository Root (default: process.cwd())
    autCommit: boolean      // Auto-Commit bei Save (default: true)
  }
}

export default defineNuxtModule<OpenPressOptions>({
  meta: {
    name: '@openpress/core',
    configKey: 'openpress',
    compatibility: { nuxt: '>=3.10.0', bridge: false }
  },
  defaults: {
    contentDir: './content',
    editPath: '/_edit',
    storage: {
      autCommit: true
    }
  },
  async setup(options, nuxt) {
    // Hook-Registrierung (siehe 3.2-3.6)
  }
})
```

### 3.2 Runtime-Verzeichnisstruktur

```
packages/core/src/
  module.ts                          # Nuxt Module Einstiegspunkt
  runtime/
    components/
      OpSection.vue                  # Section-Renderer
      OpSlot.vue                     # Slot-Renderer
      OpBlock.vue                    # Block-Renderer (dynamic component)
      OpEditFrame.vue                # Editor-Overlay (Glow Frame)
    composables/
      useOpenPress.ts                # Globaler State-Zugriff
      useEditor.ts                   # Editor-State & Actions
      usePage.ts                     # Page-Daten Composable
    server/
      api/
        pages/
          index.get.ts               # GET /api/_openpress/pages
          [slug].get.ts              # GET /api/_openpress/pages/:slug
          [slug].put.ts              # PUT /api/_openpress/pages/:slug
          [slug].delete.ts           # DELETE /api/_openpress/pages/:slug
        site.get.ts                  # GET /api/_openpress/site
        site.put.ts                  # PUT /api/_openpress/site
        navigation.get.ts            # GET /api/_openpress/navigation
        navigation.put.ts            # PUT /api/_openpress/navigation
        git/
          commit.post.ts             # POST /api/_openpress/git/commit
          history.get.ts             # GET /api/_openpress/git/history
          status.get.ts              # GET /api/_openpress/git/status
      utils/
        storage.ts                   # StorageEngine Singleton
    pages/
      _edit/
        index.vue                    # Editor Dashboard
        [slug].vue                   # Page-Editor
    plugins/
      openpress.client.ts            # Client-Plugin (Editor-Initialisierung)
```

### 3.3 Hook: Komponenten-Registrierung

```typescript
// In setup():
const resolver = createResolver(import.meta.url)

// Op-Komponenten global verfügbar machen
addComponentsDir({
  path: resolver.resolve('./runtime/components'),
  prefix: 'Op',
  global: true
})
```

**Begründung:** Alle `Op*`-Komponenten müssen in jedem Template ohne Import nutzbar sein, damit Themes und User-Pages sie direkt verwenden können.

### 3.4 Hook: Composables & Auto-Imports

```typescript
// Composables auto-importieren
addImportsDir(resolver.resolve('./runtime/composables'))
```

Registrierte Auto-Imports:
- `useOpenPress()` - Zentraler State (Site-Config, aktive Page, Editor-Modus)
- `useEditor()` - Editor-spezifischer State (Selektion, Dirty-Flag, Actions)
- `usePage(slug)` - Page-Daten laden und cachen

### 3.5 Hook: `/_edit` Routing via `pages:extend`

Der Editor bekommt eigene Pages, die unter `/_edit` gemountet werden:

```typescript
// Editor-Pages unter /_edit registrieren
nuxt.hook('pages:extend', (pages) => {
  pages.push(
    {
      name: 'openpress-edit-dashboard',
      path: `${options.editPath}`,
      file: resolver.resolve('./runtime/pages/_edit/index.vue')
    },
    {
      name: 'openpress-edit-page',
      path: `${options.editPath}/:slug(.*)*`,
      file: resolver.resolve('./runtime/pages/_edit/[slug].vue')
    }
  )
})
```

**Wichtig:** Der `/:slug(.*)*` Catch-All erlaubt verschachtelte Slugs wie `/_edit/blog/my-post`.

### 3.6 Hook: Server API Routes

Die API-Routes werden als Server-Handler registriert. Alle Routes laufen unter `/api/_openpress/`:

```typescript
const apiRoutes = [
  { route: '/api/_openpress/pages',        handler: './runtime/server/api/pages/index.get' },
  { route: '/api/_openpress/pages/:slug',  handler: './runtime/server/api/pages/[slug].get' },
  { route: '/api/_openpress/pages/:slug',  handler: './runtime/server/api/pages/[slug].put' },
  { route: '/api/_openpress/pages/:slug',  handler: './runtime/server/api/pages/[slug].delete' },
  { route: '/api/_openpress/site',         handler: './runtime/server/api/site.get' },
  { route: '/api/_openpress/site',         handler: './runtime/server/api/site.put' },
  { route: '/api/_openpress/navigation',   handler: './runtime/server/api/navigation.get' },
  { route: '/api/_openpress/navigation',   handler: './runtime/server/api/navigation.put' },
  { route: '/api/_openpress/git/commit',   handler: './runtime/server/api/git/commit.post' },
  { route: '/api/_openpress/git/history',  handler: './runtime/server/api/git/history.get' },
  { route: '/api/_openpress/git/status',   handler: './runtime/server/api/git/status.get' },
]

for (const { route, handler } of apiRoutes) {
  addServerHandler({
    route,
    handler: resolver.resolve(handler)
  })
}
```

### 3.7 Hook: Runtime-Konfiguration

OpenPress-Optionen werden sowohl im Server als auch im Client verfügbar gemacht:

```typescript
// Public Runtime Config (Client + Server)
nuxt.options.runtimeConfig.public.openpress = {
  editPath: options.editPath,
}

// Private Runtime Config (nur Server)
nuxt.options.runtimeConfig.openpress = {
  contentDir: resolver.resolve(nuxt.options.rootDir, options.contentDir),
  repoRoot: options.storage.repoRoot || nuxt.options.rootDir,
  autoCommit: options.storage.autCommit,
}
```

### 3.8 Hook: Client-Plugin für Editor

```typescript
addPlugin({
  src: resolver.resolve('./runtime/plugins/openpress.client'),
  mode: 'client'
})
```

Das Plugin initialisiert:
- Editor-State (ref: aktiver Modus, Selektion)
- Keyboard-Shortcuts (Cmd+S zum Speichern)
- Overlay-Injection (Glow-Frame Mount)

## 4. Konfiguration in `nuxt.config.ts`

```typescript
// nuxt.config.ts des Endnutzers
export default defineNuxtConfig({
  modules: ['@openpress/core'],
  openpress: {
    contentDir: './content',
    editPath: '/_edit',
    storage: {
      autoCommit: true
    }
  }
})
```

## 5. Lifecycle & Hook-Reihenfolge

```
1. defineNuxtModule setup()
   ├── 2. createResolver() - Pfadauflösung
   ├── 3. addComponentsDir() - Op-Komponenten registrieren
   ├── 4. addImportsDir() - Composables auto-importieren
   ├── 5. addPlugin() - Client-Plugin injizieren
   ├── 6. pages:extend Hook - /_edit Routen hinzufügen
   ├── 7. addServerHandler() (Loop) - API-Routes registrieren
   ├── 8. runtimeConfig setzen - Public + Private Config
   └── 9. nitro:config Hook - StorageEngine-Initialisierung (siehe Task 1.2)
```

## 6. Abhängigkeiten

| Paket | Zweck |
|-------|-------|
| `@nuxt/kit` | Module-API (`defineNuxtModule`, `addServerHandler`, etc.) |
| `@openpress/schemas` | Zod-Schemas für Validierung |
| `@openpress/poc-storage` | StorageEngine (wird zur `@openpress/storage` extrahiert) |
| `nuxt` (peer) | Nuxt 3 >= 3.10.0 |

## 7. `package.json` für `@openpress/core`

```json
{
  "name": "@openpress/core",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/module.mjs",
      "require": "./dist/module.cjs"
    }
  },
  "main": "./dist/module.cjs",
  "types": "./dist/types.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "nuxt-module-build build",
    "dev": "nuxi dev playground",
    "test": "bun test"
  },
  "dependencies": {
    "@nuxt/kit": "^3.10.0",
    "@openpress/schemas": "workspace:*"
  },
  "peerDependencies": {
    "nuxt": "^3.10.0"
  },
  "devDependencies": {
    "@nuxt/module-builder": "^0.8.0",
    "@nuxt/test-utils": "^3.14.0",
    "nuxt": "^3.10.0"
  }
}
```

## 8. Testplan

| Test | Beschreibung | Tool |
|------|-------------|------|
| Module Registration | `defineNuxtModule` wird korrekt geladen | `@nuxt/test-utils` |
| Config Defaults | Default-Werte werden gesetzt wenn nicht konfiguriert | `@nuxt/test-utils` |
| Route Injection | `/_edit` und `/_edit/:slug` sind erreichbar | `@nuxt/test-utils` |
| Component Registration | `<OpSection>` ist global verfügbar | `@nuxt/test-utils` |
| Auto-Imports | `useOpenPress()` ist ohne Import nutzbar | `@nuxt/test-utils` |
| API Routes | `/api/_openpress/pages` antwortet mit 200 | `$fetch` in Test |
| Runtime Config | `useRuntimeConfig().public.openpress` enthält `editPath` | Unit-Test |

## 9. Offene Fragen / Entscheidungen

| Frage | Vorschlag |
|-------|-----------|
| Editor nur im Dev-Modus? | Nein - auch in Production (mit Auth-Gate in EPIC 5) |
| Separate Build-Outputs für Runtime? | Ja - `nuxt-module-build` separiert Module von Runtime |
| TypeScript-Deklarationen für User-Config? | Ja - via `declare module '@nuxt/schema'` Augmentation |

## 10. Akzeptanzkriterien

- [ ] `bun run dev` startet Playground mit OpenPress-Module
- [ ] `/_edit` zeigt Editor-Dashboard
- [ ] `/_edit/index` zeigt Page-Editor für `index.json`
- [ ] `<OpSection>` und `<OpSlot>` sind global ohne Import nutzbar
- [ ] `useOpenPress()` ist in jeder Komponente auto-importiert
- [ ] `/api/_openpress/pages` gibt Seitenübersicht als JSON zurück
- [ ] Alle API-Routes antworten mit korrektem Status-Code
- [ ] `nuxt.config.ts` akzeptiert `openpress`-Konfiguration mit Autocomplete
