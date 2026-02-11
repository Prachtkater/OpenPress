# @openpress/ui

Glow-Frame UI Engine fuer OpenPress — das reaktive, theme-gesteuerte Komponentensystem fuer In-Context-Editing.

## Uebersicht

`@openpress/ui` stellt die Kern-UI-Infrastruktur fuer OpenPress bereit:

- **Op-Komponenten**: Hierarchisches Komponentensystem (`OpProvider` → `OpSection` → `OpSlot`)
- **Theme Engine**: 5-Layer Klassen-Merge mit Tailwind Merge Integration
- **Block Registry**: Dynamische Block-Aufloesung mit Fallback-Strategie
- **Context System**: Framework-agnostisches provide/inject Pattern

```
packages/ui/
├── src/
│   ├── index.ts                          # Public API
│   ├── types.ts                          # Theme-Typdefinitionen
│   └── runtime/
│       ├── context.ts                    # provide/inject (ohne Vue)
│       ├── keys.ts                       # Typisierte Context-Symbols
│       ├── components/
│       │   ├── OpProvider.ts             # Provider Setup-Logik
│       │   ├── OpSection.ts / .vue       # Section Setup + Template
│       │   ├── OpSlot.ts / .vue          # Slot Setup + Template
│       │   └── OpBlockFallback.vue       # Fallback fuer unbekannte Blocks
│       ├── composables/
│       │   ├── useOpenPress.ts           # Vollstaendiger State-Zugriff
│       │   ├── useOpMode.ts             # Editor-Modus Zugriff
│       │   ├── useOpSection.ts          # Section-Kontext Zugriff
│       │   ├── useOpSlot.ts             # Slot-Kontext Zugriff
│       │   └── useOpThemeClasses.ts     # Theme-Klassen-Aufloesung
│       ├── blocks/
│       │   └── resolve.ts               # Block-Registry
│       └── theme/
│           ├── resolve.ts               # Theme-Registry (Lazy-Load)
│           ├── resolve-classes.ts       # 5-Layer Merge-Algorithmus
│           └── defaults/               # Standard-Theme-Klassen
│               ├── index.ts
│               ├── section.ts
│               └── slot.ts
```

## Das `Op`-Praefix

Alle System-Komponenten, Composables und Konstanten tragen das Praefix `Op` (kurz fuer **O**pen**P**ress). Dies dient der klaren Abgrenzung zwischen CMS-Infrastruktur und User-Content:

| Kategorie | Namensschema | Beispiele |
|---|---|---|
| Komponenten | `Op{Name}` | `OpProvider`, `OpSection`, `OpSlot` |
| Composables | `useOp{Name}` | `useOpMode`, `useOpThemeClasses` |
| Context-Keys | `OP_{NAME}_KEY` | `OP_PAGE_KEY`, `OP_THEME_KEY` |
| Block-Composables | `useOpBlock{Name}` | `useOpBlockClasses` |

User-definierte Content-Blocks (z.B. `RichText`, `ImageGallery`) verwenden kein `Op`-Praefix — die Unterscheidung ist so immer sofort ersichtlich.

## Komponenten-Hierarchie

Die Op-Komponenten bilden einen verschachtelten Kontext-Baum:

```
OpProvider                          ← Globaler State (Page, Site, Theme, Mode)
  └─ OpSection                      ← Semantischer Seitenbereich (hero, features, cta)
       └─ OpSlot                    ← Container fuer eine geordnete Liste von Blocks
            ├─ RichText (Block)     ← Registrierter Content-Block
            ├─ Image (Block)        ← Registrierter Content-Block
            └─ OpBlockFallback      ← Fallback fuer unbekannte Block-Types
```

### OpProvider

Stellt den gesamten globalen State via Context bereit:

```typescript
import { setupOpProvider } from '@openpress/ui'

const state = setupOpProvider({
  page: myPage,           // Page-Daten (Zod-validiert)
  site: mySiteConfig,     // Site-Konfiguration
  navigation: myNav,      // Navigation (optional, default: { main: [], footer: [] })
  editing: true,          // Editor-Modus (default: false)
  theme: 'tailwind-plus', // Theme-Name (default: site.theme ?? 'tailwind-plus')
})

// state.dataAttributes → { 'data-op-mode': 'edit', 'data-op-theme': 'tailwind-plus' }
```

Bereitgestellter Kontext:
- `OP_PAGE_KEY` → Aktuelle Page-Daten
- `OP_SITE_KEY` → Site-Konfiguration (frozen)
- `OP_NAV_KEY` → Navigation (frozen)
- `OP_MODE_KEY` → `'view'` oder `'edit'`
- `OP_THEME_KEY` → Aufgeloestes Theme (frozen)

### OpSection

Rendert einen semantischen Container und stellt den Section-Kontext fuer verschachtelte `OpSlot`s bereit:

```vue
<OpSection :section="heroSection" :ui="{ root: 'bg-blue-900' }">
  <!-- Scoped Slot fuer eigene Layouts -->
  <template #default="{ section, slots }">
    <OpSlot name="main" :blocks="slots.main" />
    <OpSlot name="sidebar" :blocks="slots.sidebar" />
  </template>
</OpSection>
```

Generierte Data-Attribute:

```html
<section data-op-section="hero" data-op-id="01ARZ3..." data-op-editing="">
  <div class="relative overflow-hidden min-h-[60vh] ...">
    <!-- Slots -->
  </div>
</section>
```

### OpSlot

Rendert die geordnete Liste von Blocks innerhalb einer Section:

```vue
<OpSlot name="default" :blocks="blocks" :ui="{ root: 'gap-8' }" />
```

- Loest Block-Types via `resolveBlockComponent()` auf registrierte Komponenten auf
- Zeigt im Edit-Modus einen Platzhalter fuer leere Slots
- Wirft einen Fehler wenn ausserhalb von `<OpSection>` verwendet

## Reaktives Theme-Klassen-System

### useOpThemeClasses

Das zentrale Composable fuer Theme-gesteuerte CSS-Klassen. Es nutzt eine **5-Layer Merge-Strategie** mit aufsteigender Prioritaet:

```
Layer 1: Theme-Default (slots)          ← Basis-Klassen
Layer 2: Variant-Klassen                ← Basierend auf aktiven Variants
Layer 3: Compound Variants              ← Wenn mehrere Variants gleichzeitig matchen
Layer 4: app.config.ts Overrides        ← Globale User-Overrides
Layer 5: ui Prop                        ← Instanz-spezifische Overrides (hoechste Prioritaet)
```

```typescript
import { useOpThemeClasses, useOpBlockClasses } from '@openpress/ui'

// Fuer Op-Komponenten (section, slot, provider)
const classes = useOpThemeClasses(
  'section',                           // Komponenten-Typ
  { type: 'hero' },                    // Aktive Variants
  configOverrides,                     // Aus app.config.ts (optional)
  { root: 'bg-gradient-to-r ...' },   // ui Prop (optional)
)
// classes.root → 'relative overflow-hidden min-h-[60vh] flex items-center bg-gradient-to-r ...'
// classes.inner → 'mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8'

// Fuer Content-Blocks
const blockClasses = useOpBlockClasses(
  'rich-text',                         // Block-Type
  { size: 'large' },                   // Aktive Variants
)
```

### Theme-Konfiguration (OpThemeConfig)

Ein Theme definiert Klassen pro Komponente, aufgeteilt in **Slots**, **Variants** und **Compound Variants**:

```typescript
import type { OpThemeConfig, OpComponentTheme } from '@openpress/ui'

const myTheme: OpThemeConfig = {
  name: 'my-theme',
  components: {
    // System-Komponenten
    section: {
      slots: {
        root: 'relative',
        inner: 'mx-auto max-w-7xl',
      },
      variants: {
        type: {
          hero: {
            root: 'overflow-hidden min-h-[60vh] flex items-center',
            inner: 'px-6 py-24 sm:py-32 lg:px-8',
          },
          cta: {
            root: 'bg-primary-600',
            inner: 'px-6 py-16 text-center text-white',
          },
        },
      },
      compoundVariants: [
        {
          type: 'hero',
          color: 'dark',
          class: { root: 'bg-gray-900 text-white' },
        },
      ],
      defaultVariants: {
        type: 'content',
      },
    },

    // Block-Themes (Praefix 'block:')
    'block:rich-text': {
      slots: { root: 'prose dark:prose-invert' },
      variants: {
        size: {
          large: { root: 'prose-lg' },
          small: { root: 'prose-sm' },
        },
      },
    },
  },
}
```

### Der Merge-Algorithmus im Detail

`resolveComponentClasses()` iteriert ueber alle definierten Slots und sammelt pro Slot die Klassen aller 5 Layer:

```typescript
import { resolveComponentClasses } from '@openpress/ui'

const sectionTheme: OpComponentTheme = {
  slots: { root: 'relative', inner: 'mx-auto max-w-7xl' },
  variants: {
    type: {
      hero: { root: 'min-h-[60vh]', inner: 'px-6 py-24' },
    },
  },
  defaultVariants: { type: 'content' },
}

const classes = resolveComponentClasses(
  sectionTheme,
  { type: 'hero' },                    // Ueberschreibt defaultVariants
  { root: 'max-w-6xl' },              // app.config Override
  { inner: 'py-32' },                 // ui Prop Override
)

// Ergebnis (nach twMerge):
// classes.root  → 'relative min-h-[60vh] max-w-6xl'
// classes.inner → 'mx-auto max-w-7xl py-32'
//                                    ^^^^^ twMerge loest px-6 py-24 vs py-32 auf
```

## Tailwind Merge Integration

Jeder Layer-Merge verwendet `twMerge()` aus [tailwind-merge](https://github.com/dcastil/tailwind-merge). Das verhindert CSS-Konflikte bei Tailwind-Klassen:

```typescript
import { twMerge } from 'tailwind-merge'

// Ohne twMerge:
'px-6 py-24 py-32'   // → Konflikt: py-24 UND py-32 aktiv

// Mit twMerge:
twMerge('px-6 py-24', 'py-32')   // → 'px-6 py-32'  (py-24 entfernt)
twMerge('bg-red-500', 'bg-blue-500')  // → 'bg-blue-500'
twMerge('p-4', 'px-6')               // → 'p-4 px-6'  (px spezifischer als p)
```

Der Algorithmus in `resolve-classes.ts` sammelt alle Layer-Klassen als Array und merged sie in einem einzigen `twMerge()`-Aufruf:

```typescript
// Pro Slot: Alle Layer-Klassen gesammelt
const layers: string[] = []
layers.push(theme.slots[slot])          // Layer 1: Base
layers.push(variantClasses)             // Layer 2: Variants
layers.push(compoundClasses)            // Layer 3: Compound Variants
layers.push(configOverrides[slot])      // Layer 4: Config
layers.push(uiOverrides[slot])          // Layer 5: UI Prop

result[slot] = twMerge(...layers)       // Intelligentes Merge
```

## Eigene Komponenten erstellen

### Eigene Blocks registrieren

Blocks werden ueber die Block-Registry registriert und von `OpSlot` automatisch aufgeloest:

```typescript
import { registerBlock, type BlockComponentDef } from '@openpress/ui'

// Block-Komponente definieren
const MyImageBlock: BlockComponentDef = {
  name: 'ImageBlock',
  render: (block) => ({
    src: block.props.src,
    alt: block.props.alt,
  }),
}

// Block registrieren
registerBlock('image', MyImageBlock)
```

Nicht registrierte Block-Types werden automatisch durch `OpBlockFallback` ersetzt (nur im Edit-Modus sichtbar).

### Composables in eigenen Komponenten nutzen

Innerhalb der Op-Hierarchie koennen Composables verwendet werden, um auf den Kontext zuzugreifen:

```typescript
import { useOpenPress, useOpMode, useOpSection, useOpSlot } from '@openpress/ui'

// Vollstaendiger State
const { page, site, mode, isEditing, theme } = useOpenPress()

// Nur Editor-Modus (leichtgewichtig)
const { isEditing } = useOpMode()

// Section-Kontext (nur innerhalb OpSection)
const { section } = useOpSection()

// Slot-Kontext (nur innerhalb OpSlot)
const { slot } = useOpSlot()  // → { name: 'default', sectionId: '01ARZ3...' }
```

### Theme-Klassen in eigenen Komponenten

Eigene Komponenten koennen das `ui` Prop Pattern verwenden, um Theme-Klassen zu unterstuetzen:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useOpThemeClasses } from '@openpress/ui'

interface MyComponentUI {
  root?: string
  title?: string
  body?: string
}

const props = defineProps<{
  variant?: 'default' | 'highlight'
  ui?: MyComponentUI
}>()

// Theme-Klassen-Aufloesung: Theme-Default → Variants → ui Prop
const classes = computed(() =>
  useOpThemeClasses(
    'my-component',
    { variant: props.variant ?? 'default' },
    undefined,
    props.ui,
  ),
)
</script>

<template>
  <div :class="classes.root">
    <h2 :class="classes.title"><slot name="title" /></h2>
    <div :class="classes.body"><slot /></div>
  </div>
</template>
```

Damit die Klassen aufgeloest werden, muss die Komponente im aktiven Theme registriert sein:

```typescript
const theme: OpThemeConfig = {
  name: 'my-theme',
  components: {
    // ... bestehende Komponenten
    'my-component': {
      slots: {
        root: 'rounded-lg shadow-md p-6',
        title: 'text-xl font-bold mb-4',
        body: 'text-gray-600',
      },
      variants: {
        variant: {
          highlight: {
            root: 'bg-yellow-50 border-yellow-200 border',
            title: 'text-yellow-800',
          },
        },
      },
    },
  },
}
```

### Das `ui` Prop Pattern

Das `ui` Prop ermoeglicht instanz-spezifische Klassen-Overrides — analog zum Pattern in [Nuxt UI](https://ui.nuxt.com):

```vue
<!-- Standard-Darstellung -->
<OpSection :section="heroSection" />

<!-- Mit instanz-spezifischen Overrides -->
<OpSection
  :section="heroSection"
  :ui="{
    root: 'bg-gradient-to-r from-blue-600 to-purple-600',
    inner: 'py-32',
  }"
/>
```

Die Override-Hierarchie (`ui` Prop hat die hoechste Prioritaet):

```
Theme-Default  →  Variants  →  Compound Variants  →  app.config  →  ui Prop
   (base)        (type=hero)   (type+color match)    (global)       (instanz)
```

## Theme Engine

### Theme registrieren (Lazy-Loading)

Themes werden als Lazy-Loader registriert, um die Bundle-Groesse zu minimieren:

```typescript
import { registerTheme, loadTheme, resolveTheme } from '@openpress/ui'

// Theme mit Lazy-Loader registrieren
registerTheme('tailwind-plus', () =>
  import('@openpress/theme-tailwind-plus').then(m => m.theme)
)

// Synchrone Aufloesung (SSR — gibt Fallback wenn nicht geladen)
const theme = resolveTheme('tailwind-plus')

// Async Laden (Client-seitig, nach Hydration)
const theme = await loadTheme('tailwind-plus')
```

### Standard-Theme

`@openpress/ui` beinhaltet ein Default-Theme mit Basis-Klassen:

```typescript
import { defaultTheme, sectionTheme, slotTheme } from '@openpress/ui'

// defaultTheme enthaelt:
// - section: root ('relative'), inner ('mx-auto max-w-7xl')
//   Variants: hero, features, cta, content, footer
// - slot: root ('flex flex-col'), empty (dashed border placeholder)
//   Variants: default (gap-6), sidebar (gap-4), media (gap-2)
```

## Context System

Das Package verwendet ein leichtgewichtiges `provide`/`inject` Pattern, das **ohne Vue-Runtime** funktioniert:

```typescript
import { provide, inject, clearContext } from '@openpress/ui'
import { OP_PAGE_KEY } from '@openpress/ui'

// Wert bereitstellen
provide(OP_PAGE_KEY, myPage)

// Wert lesen
const page = inject<Page>(OP_PAGE_KEY)

// Kontext zuruecksetzen (in Tests)
clearContext()
```

In der Vue-Umgebung (`.vue`-Dateien) wird Vue's eigenes `provide`/`inject` verwendet. Die `.ts` Setup-Funktionen nutzen das interne Map-basierte System, sodass die gesamte Core-Logik mit Bun testbar ist — ohne Vue-Runtime.

## API-Referenz

### Typen

| Typ | Beschreibung |
|---|---|
| `OpThemeConfig` | Theme-Konfiguration (`name` + `components`) |
| `OpComponentTheme` | Klassen-Definition pro Komponente (`slots`, `variants`, `compoundVariants`, `defaultVariants`) |
| `OpCompoundVariant` | Klassen die nur bei Mehrfach-Variant-Match gelten |
| `ResolvedClasses` | Aufgeloeste Klassen als `Record<string, string>` |
| `OpSlotContext` | Slot-Kontext (`name`, `sectionId`) |
| `BlockComponentDef` | Block-Komponenten-Definition (`name`, optionales `render`) |

### Composables

| Composable | Kontext | Rueckgabe |
|---|---|---|
| `useOpenPress()` | `OpProvider` | `{ page, site, navigation, mode, isEditing, theme }` |
| `useOpMode()` | `OpProvider` | `{ mode, isEditing }` |
| `useOpSection()` | `OpSection` | `{ section }` |
| `useOpSlot()` | `OpSlot` | `{ slot: { name, sectionId } }` |
| `useOpThemeClasses()` | `OpProvider` | `ResolvedClasses` |
| `useOpBlockClasses()` | `OpProvider` | `ResolvedClasses` |

### Setup-Funktionen

| Funktion | Beschreibung |
|---|---|
| `setupOpProvider(props)` | Initialisiert globalen State, gibt `OpProviderState` zurueck |
| `setupOpSection(props)` | Initialisiert Section-Kontext, gibt `OpSectionState` zurueck |
| `setupOpSlot(props)` | Initialisiert Slot-Kontext, gibt `OpSlotState` zurueck |

### Theme-Funktionen

| Funktion | Beschreibung |
|---|---|
| `registerTheme(name, loader)` | Registriert Theme mit Lazy-Loader |
| `resolveTheme(name)` | Synchrone Theme-Aufloesung (SSR) |
| `loadTheme(name)` | Async Theme-Laden mit Cache |
| `resolveComponentClasses(theme, variants, config?, ui?)` | 5-Layer Klassen-Merge |

### Block-Funktionen

| Funktion | Beschreibung |
|---|---|
| `registerBlock(type, component)` | Registriert Block-Komponente |
| `resolveBlockComponent(type)` | Loest Block-Type auf (oder Fallback) |
| `hasBlock(type)` | Prueft ob Block-Type registriert |
| `getRegisteredBlockTypes()` | Liste aller registrierten Types |

## Dependencies

| Package | Version | Zweck |
|---|---|---|
| `@openpress/schemas` | `workspace:*` | Zod-Schemas (Page, Section, Block, Site) |
| `tailwind-merge` | `^3.4.0` | Intelligentes Tailwind-Klassen-Merge |
| `zod` | `^3.24.0` | Schema-Validierung (Dev-Mode) |
