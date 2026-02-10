# Task 2.3: Tailwind-Klassen-Mapping System (Nuxt UI Style)

**EPIC:** 2 — UI Engine & Component Bridge (Op-System)
**Paket:** `@openpress/ui`
**Pfad:** `packages/ui/src/runtime/theme/`
**Abhängigkeiten:** Task 2.1 (OpProvider), Task 2.2 (OpSection/OpSlot)

---

## 1. Zielsetzung

Ein Theme-System nach dem Vorbild von Nuxt UI, das Tailwind-Klassen über eine strukturierte API an Op-Komponenten verteilt. Themes definieren Klassen-Mappings für Slots und Variants — Komponenten konsumieren sie via Composable. Overrides sind auf drei Ebenen möglich: Theme-Default → `app.config.ts` → `ui` Prop.

**Kernprinzip:** Striktes Feature/Theme Separation. Op-Komponenten enthalten **null** Tailwind-Klassen. Alle visuellen Klassen kommen aus dem Theme-Layer.

---

## 2. Konzept-Übersicht

### 2.1 Nuxt UI als Vorbild

Nuxt UI definiert pro Komponente ein Theme-Objekt mit:

```typescript
// Nuxt UI Beispiel (UButton)
export default {
  slots: {
    base: 'font-medium inline-flex items-center',
    leadingIcon: 'shrink-0',
    trailingIcon: 'shrink-0',
  },
  variants: {
    size: {
      sm: { base: 'text-xs gap-1 px-2 py-1' },
      md: { base: 'text-sm gap-1.5 px-3 py-1.5' },
    },
    color: {
      primary: { base: '' },   // Wird via compoundVariants aufgelöst
    },
  },
  compoundVariants: [
    { color: 'primary', variant: 'solid', class: { base: 'bg-primary text-white' } },
  ],
  defaultVariants: { size: 'md', color: 'primary', variant: 'solid' },
}
```

### 2.2 OpenPress Adaption

OpenPress übernimmt dieses Pattern 1:1, aber für die Op-Komponentenhierarchie:

```typescript
// theme-tailwind-plus/components/section.ts
export default {
  slots: {
    root: '',         // <section> Element
    inner: '',        // Inner Container
  },
  variants: {
    type: {
      hero: {
        root: 'relative overflow-hidden',
        inner: 'mx-auto max-w-7xl px-6 py-24 lg:px-8',
      },
      features: {
        root: 'bg-gray-50 dark:bg-gray-900',
        inner: 'mx-auto max-w-7xl px-6 py-16 lg:px-8',
      },
      cta: {
        root: 'bg-primary-600 dark:bg-primary-500',
        inner: 'mx-auto max-w-4xl px-6 py-16 text-center',
      },
    },
  },
  defaultVariants: {},
}
```

---

## 3. Type-System

### 3.1 Core Types

```typescript
// packages/ui/src/types.ts

/**
 * Theme-Definition für eine einzelne Op-Komponente.
 * Folgt dem Tailwind Variants Pattern von Nuxt UI.
 */
export interface OpComponentTheme {
  /** Basis-Klassen pro Slot */
  slots: Record<string, string>

  /**
   * Variant-spezifische Klassen.
   * Struktur: { variantName: { variantValue: { slotName: classes } } }
   */
  variants?: Record<string, Record<string, Record<string, string>>>

  /**
   * Klassen die nur gelten wenn mehrere Variants gleichzeitig matchen.
   * Analog zu Nuxt UI compoundVariants.
   */
  compoundVariants?: OpCompoundVariant[]

  /** Default-Werte für Variants */
  defaultVariants?: Record<string, string>
}

export interface OpCompoundVariant {
  /** Bedingungen: { variantName: variantValue } */
  [key: string]: string | { [slotName: string]: string }
  /** Klassen die bei Match angewendet werden */
  class: Record<string, string>
}

/**
 * Vollständige Theme-Definition.
 * Enthält Klassen-Mappings für alle Op-Komponenten.
 */
export interface OpThemeConfig {
  name: string
  components: {
    section?: OpComponentTheme
    slot?: OpComponentTheme
    block?: Record<string, OpComponentTheme>  // Keyed by block-type
    provider?: OpComponentTheme
  }
}
```

### 3.2 Resolved Classes Type

```typescript
/**
 * Aufgelöste Klassen für eine Komponenten-Instanz.
 * Das Ergebnis nach Merge von Theme + app.config + Variants.
 */
export type ResolvedClasses = Record<string, string>
```

---

## 4. Theme-Definition (Autor-Perspektive)

### 4.1 Theme-Paket Struktur

```
packages/theme-tailwind-plus/
├── src/
│   ├── index.ts                  ← Theme-Export + Registration
│   ├── components/
│   │   ├── section.ts            ← OpSection Klassen
│   │   ├── slot.ts               ← OpSlot Klassen
│   │   └── blocks/
│   │       ├── rich-text.ts      ← OpRichText Block-Klassen
│   │       ├── image.ts          ← OpImage Block-Klassen
│   │       └── button.ts         ← OpButton Block-Klassen
│   └── tokens.css                ← CSS Custom Properties
└── package.json
```

### 4.2 Beispiel: Section Theme

```typescript
// packages/theme-tailwind-plus/src/components/section.ts
import type { OpComponentTheme } from '@openpress/ui'

export const section: OpComponentTheme = {
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
      features: {
        root: 'bg-gray-50 dark:bg-gray-900/50',
        inner: 'px-6 py-24 sm:py-32 lg:px-8',
      },
      cta: {
        root: 'bg-primary-600 dark:bg-primary-500',
        inner: 'px-6 py-16 sm:py-20 lg:px-8 text-center text-white',
      },
      content: {
        root: '',
        inner: 'px-6 py-16 lg:px-8 prose prose-lg dark:prose-invert mx-auto',
      },
      footer: {
        root: 'bg-gray-900 text-gray-300',
        inner: 'px-6 py-12 lg:px-8',
      },
    },
  },
}
```

### 4.3 Beispiel: Slot Theme

```typescript
// packages/theme-tailwind-plus/src/components/slot.ts
import type { OpComponentTheme } from '@openpress/ui'

export const slot: OpComponentTheme = {
  slots: {
    root: 'flex flex-col',
    empty: 'min-h-[4rem] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400',
  },
  variants: {
    name: {
      default: { root: 'gap-6' },
      sidebar: { root: 'gap-4' },
      media: { root: 'gap-2' },
    },
  },
}
```

### 4.4 Theme-Index

```typescript
// packages/theme-tailwind-plus/src/index.ts
import type { OpThemeConfig } from '@openpress/ui'
import { section } from './components/section'
import { slot } from './components/slot'
import { richText } from './components/blocks/rich-text'
import { image } from './components/blocks/image'
import { button } from './components/blocks/button'

export const theme: OpThemeConfig = {
  name: 'tailwind-plus',
  components: {
    section,
    slot,
    block: {
      'rich-text': richText,
      'image': image,
      'button': button,
    },
  },
}
```

---

## 5. Klassen-Resolution Engine

### 5.1 Merge-Reihenfolge (Priorität aufsteigend)

```
1. Theme-Default (slots)           ← Basis-Klassen aus dem Theme
2. Theme-Variants                  ← Klassen basierend auf aktiven Variants
3. Theme-CompoundVariants          ← Klassen wenn mehrere Variants matchen
4. app.config.ts Overrides         ← Globale User-Overrides
5. ui Prop                         ← Instanz-spezifische Overrides
```

**Tailwind Merge:** Auf jeder Stufe werden Klassen mit `tailwind-merge` zusammengeführt, sodass spätere Werte konfligierende frühere überschreiben.

### 5.2 resolveComponentClasses()

```typescript
// packages/ui/src/runtime/theme/resolve-classes.ts
import { twMerge } from 'tailwind-merge'
import type { OpComponentTheme, ResolvedClasses } from '../../types'

/**
 * Löst die finalen Klassen für eine Komponente auf.
 *
 * @param theme - Theme-Definition der Komponente
 * @param activeVariants - Aktuell aktive Variants { type: 'hero', size: 'lg' }
 * @param configOverrides - Overrides aus app.config.ts
 * @param uiOverrides - Overrides aus dem ui-Prop
 * @returns Aufgelöste Klassen pro Slot
 */
export function resolveComponentClasses(
  theme: OpComponentTheme,
  activeVariants: Record<string, string>,
  configOverrides?: Partial<Record<string, string>>,
  uiOverrides?: Partial<Record<string, string>>,
): ResolvedClasses {
  const slotNames = Object.keys(theme.slots)
  const result: ResolvedClasses = {}

  for (const slot of slotNames) {
    const layers: string[] = []

    // Layer 1: Base Slot Klassen
    if (theme.slots[slot]) {
      layers.push(theme.slots[slot])
    }

    // Layer 2: Variant Klassen
    if (theme.variants) {
      // Merge defaultVariants mit activeVariants (active wins)
      const merged = { ...theme.defaultVariants, ...activeVariants }

      for (const [variantName, variantValue] of Object.entries(merged)) {
        const variantClasses = theme.variants[variantName]?.[variantValue]?.[slot]
        if (variantClasses) {
          layers.push(variantClasses)
        }
      }
    }

    // Layer 3: Compound Variants
    if (theme.compoundVariants) {
      const mergedVariants = { ...theme.defaultVariants, ...activeVariants }

      for (const compound of theme.compoundVariants) {
        const conditions = Object.entries(compound).filter(([key]) => key !== 'class')
        const allMatch = conditions.every(
          ([key, value]) => mergedVariants[key] === value
        )
        if (allMatch && compound.class[slot]) {
          layers.push(compound.class[slot])
        }
      }
    }

    // Layer 4: app.config.ts Overrides
    if (configOverrides?.[slot]) {
      layers.push(configOverrides[slot])
    }

    // Layer 5: ui Prop Overrides
    if (uiOverrides?.[slot]) {
      layers.push(uiOverrides[slot])
    }

    // Merge alle Layers mit tailwind-merge
    result[slot] = twMerge(...layers)
  }

  return result
}
```

### 5.3 Composable: useOpThemeClasses()

```typescript
// packages/ui/src/runtime/composables/useOpThemeClasses.ts
import { computed, inject } from 'vue'
import { OP_THEME_KEY } from '../keys'
import { resolveComponentClasses } from '../theme/resolve-classes'
import { useAppConfig } from '#imports'
import type { ResolvedClasses } from '../../types'

type ComponentType = 'section' | 'slot' | 'provider'
type BlockType = string

/**
 * Löst Theme-Klassen für eine Op-Komponente auf.
 *
 * @param component - Komponenten-Typ ('section', 'slot')
 * @param variant - Aktiver Variant-Wert (z.B. Section-Type 'hero')
 * @param uiOverrides - Optional: ui-Prop Overrides
 */
export function useOpThemeClasses(
  component: ComponentType,
  variant?: string,
  uiOverrides?: Partial<Record<string, string>>,
): ResolvedClasses

/**
 * Overload für Block-Klassen.
 */
export function useOpThemeClasses(
  component: 'block',
  blockType: string,
  uiOverrides?: Partial<Record<string, string>>,
): ResolvedClasses

export function useOpThemeClasses(
  component: ComponentType | 'block',
  variantOrBlockType?: string,
  uiOverrides?: Partial<Record<string, string>>,
) {
  const themeRef = inject(OP_THEME_KEY)
  const appConfig = useAppConfig()

  return computed(() => {
    if (!themeRef?.value) {
      return {}
    }

    const theme = themeRef.value

    // Theme-Definition für diese Komponente finden
    let componentTheme
    if (component === 'block' && variantOrBlockType) {
      componentTheme = theme.components.block?.[variantOrBlockType]
    } else {
      componentTheme = theme.components[component as ComponentType]
    }

    if (!componentTheme) {
      return {}
    }

    // Aktive Variants bestimmen
    const activeVariants: Record<string, string> = {}
    if (component === 'section' && variantOrBlockType) {
      activeVariants.type = variantOrBlockType
    } else if (component === 'slot' && variantOrBlockType) {
      activeVariants.name = variantOrBlockType
    }

    // app.config.ts Overrides
    const configPath = component === 'block'
      ? `op.block.${variantOrBlockType}`
      : `op.${component}`
    const configOverrides = getNestedConfig(appConfig, configPath)

    return resolveComponentClasses(
      componentTheme,
      activeVariants,
      configOverrides,
      uiOverrides,
    )
  })
}

/**
 * Hilfsfunktion: Nested Config-Wert aus app.config.ts lesen.
 * Pfad: 'op.section' → appConfig.op?.section
 */
function getNestedConfig(
  config: Record<string, unknown>,
  path: string,
): Partial<Record<string, string>> | undefined {
  const parts = path.split('.')
  let current: unknown = config
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current as Partial<Record<string, string>> | undefined
}
```

---

## 6. app.config.ts Integration

### 6.1 Config-Struktur

```typescript
// app.config.ts (User-Projekt)
export default defineAppConfig({
  op: {
    section: {
      // Overrides für OpSection Slots
      root: 'scroll-mt-16',    // Wird auf ALLE Sections angewendet
      inner: '',
    },
    slot: {
      // Overrides für OpSlot Slots
      root: '',
      empty: 'bg-blue-50 dark:bg-blue-950',
    },
    block: {
      'rich-text': {
        // Overrides für den Rich-Text Block
        root: 'prose-sm',
      },
    },
  },
})
```

### 6.2 TypeScript Declaration

```typescript
// packages/ui/src/app.config.d.ts
declare module 'nuxt/schema' {
  interface AppConfigInput {
    op?: {
      section?: Partial<Record<string, string>>
      slot?: Partial<Record<string, string>>
      block?: Record<string, Partial<Record<string, string>>>
    }
  }
}

export {}
```

---

## 7. Tailwind Merge Konfiguration

### 7.1 Dependency

```json
// packages/ui/package.json (dependencies)
{
  "tailwind-merge": "^2.6.0"
}
```

### 7.2 Warum tailwind-merge?

Ohne tailwind-merge:
```
Theme:  "px-6 py-24"
Config: "px-8"
Result: "px-6 py-24 px-8"   ← KONFLIKT: px-6 und px-8
```

Mit tailwind-merge:
```
Theme:  "px-6 py-24"
Config: "px-8"
Result: "py-24 px-8"        ← KORREKT: px-8 überschreibt px-6
```

---

## 8. Dark Mode Support

OpenPress verwendet **keine eigene** Dark-Mode-Logik. Das System baut auf Tailwinds `dark:` Variante auf:

```typescript
// Theme-Autor schreibt:
slots: {
  root: 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100',
}
```

Der Dark-Mode-Toggle selbst ist Sache der Host-Applikation (Nuxt `@nuxtjs/color-mode` oder manuell). OpenPress konsumiert nur.

---

## 9. CSS Custom Properties (Design Tokens)

### 9.1 Op-spezifische CSS Variables

Themes können zusätzlich CSS Custom Properties definieren für Werte die nicht gut als Tailwind-Klassen abbildbar sind:

```css
/* packages/theme-tailwind-plus/src/tokens.css */
:root {
  --op-section-transition: 200ms ease;
  --op-slot-min-height: 4rem;
  --op-block-focus-ring: 0 0 0 2px var(--color-primary-500);
  --op-glow-frame-z: 9999;
}
```

Diese Tokens werden vom Theme-Paket via Nuxt CSS-Config eingebunden:

```typescript
// packages/theme-tailwind-plus/src/nuxt-plugin.ts
export default defineNuxtPlugin(() => {
  // tokens.css wird via Nuxt Module CSS-Option registriert
})
```

### 9.2 Semantische Farben

OpenPress definiert keine eigenen Farb-Paletten. Es nutzt die Tailwind/Nuxt UI `primary`, `secondary`, `neutral` etc. Semantik. Themes referenzieren diese:

```typescript
cta: {
  root: 'bg-primary-600 dark:bg-primary-500',  // ← Nutzt semantic color
}
```

Die tatsächliche Farbe wird in `app.config.ts` oder `tailwind.config.ts` des Users bestimmt.

---

## 10. Theme-Registration Flow

```
1. Nuxt-App startet
2. @openpress/core Modul wird geladen
3. Core erkennt installierte Theme-Pakete (aus nuxt.config.ts)
4. Theme-Paket exportiert OpThemeConfig
5. Core registriert Theme via registerTheme()
6. OpProvider löst aktives Theme auf (site.theme → resolveTheme())
7. Theme-Config wird via provide(OP_THEME_KEY) bereitgestellt
8. Op-Komponenten konsumieren via useOpThemeClasses()
```

### 10.1 nuxt.config.ts

```typescript
// User-Projekt: nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@openpress/core'],
  openpress: {
    theme: '@openpress/theme-tailwind-plus',  // Theme-Paket
  },
})
```

### 10.2 Core-Module Registration

```typescript
// packages/core/src/module.ts (relevant excerpt)
export default defineNuxtModule<OpenPressOptions>({
  meta: { name: '@openpress/core', configKey: 'openpress' },
  defaults: {
    theme: '@openpress/theme-tailwind-plus',
  },
  async setup(options, nuxt) {
    // Theme-Paket laden
    const themeModule = await import(options.theme)
    registerTheme(themeModule.theme.name, () => themeModule.theme)

    // Theme CSS-Tokens einbinden
    if (themeModule.css) {
      nuxt.options.css.push(themeModule.css)
    }
  },
})
```

---

## 11. Datei-Struktur

```
packages/ui/src/
├── runtime/
│   ├── theme/
│   │   ├── resolve.ts              ← Theme-Registry (Task 2.1)
│   │   └── resolve-classes.ts      ← Klassen-Resolution Engine (DIESER TASK)
│   ├── composables/
│   │   └── useOpThemeClasses.ts    ← Theme-Klassen Composable (DIESER TASK)
│   └── ...
├── types.ts                        ← OpComponentTheme, OpThemeConfig etc.
└── app.config.d.ts                 ← TypeScript Declaration für app.config

packages/theme-tailwind-plus/src/   ← Referenz-Theme (parallel erstellen)
├── index.ts
├── tokens.css
└── components/
    ├── section.ts
    ├── slot.ts
    └── blocks/
        ├── rich-text.ts
        ├── image.ts
        └── button.ts
```

---

## 12. Testplan

| Test | Beschreibung | Typ |
|------|-------------|-----|
| Base Slots | Nur Basis-Klassen ohne Variants | Unit |
| Single Variant | `type: 'hero'` → korrekte Klassen | Unit |
| Default Variants | `defaultVariants` werden angewendet | Unit |
| Variant Override | Aktive Variants überschreiben Defaults | Unit |
| Compound Variants | Mehrere Conditions → Match | Unit |
| Compound No-Match | Nicht alle Conditions → kein Match | Unit |
| Config Override | app.config.ts Werte überschreiben Theme | Unit |
| UI Prop Override | `ui` Prop überschreibt alles | Unit |
| Tailwind Merge | Konfligierende Klassen werden korrekt gemerged | Unit |
| Empty Theme | Fehlende Theme-Definition → leere Klassen | Unit |
| Block Theme | Block-spezifische Klassen werden aufgelöst | Unit |
| useOpThemeClasses | Composable gibt reaktive Klassen zurück | Unit |

---

## 13. Performance-Überlegungen

### 13.1 Computed Caching

`useOpThemeClasses()` gibt ein `computed` zurück. Vue cached das Ergebnis und re-evaluiert nur bei Änderung der Dependencies (Theme-Ref, Variant-Wert).

### 13.2 tailwind-merge Instanz

```typescript
// packages/ui/src/runtime/theme/tw.ts
import { createTailwindMerge, getDefaultConfig } from 'tailwind-merge'

// Singleton: Eine twMerge-Instanz für die gesamte App
export const twMerge = createTailwindMerge(getDefaultConfig)
```

### 13.3 SSR

Die gesamte Theme-Resolution ist synchron und SSR-kompatibel. Keine async Operationen im Rendering-Path.

---

## 14. Nutzungsbeispiel (End-to-End)

### Theme-Autor definiert Klassen:

```typescript
// theme-tailwind-plus/src/components/section.ts
export const section = {
  slots: { root: 'relative', inner: 'mx-auto max-w-7xl' },
  variants: {
    type: {
      hero: { root: 'min-h-[60vh]', inner: 'px-6 py-24' },
    },
  },
}
```

### User überschreibt global:

```typescript
// app.config.ts
export default defineAppConfig({
  op: { section: { inner: 'max-w-6xl' } },  // Schmaler!
})
```

### Komponente überschreibt lokal:

```vue
<OpSection :section="section" :ui="{ root: 'bg-black' }" />
```

### Resultierende Klassen für `root` (Section type="hero"):

```
Theme base:    "relative"
+ Variant:     "min-h-[60vh]"
+ Config:      (nichts für root)
+ ui Prop:     "bg-black"
= twMerge:     "relative min-h-[60vh] bg-black"
```

### Resultierende Klassen für `inner`:

```
Theme base:    "mx-auto max-w-7xl"
+ Variant:     "px-6 py-24"
+ Config:      "max-w-6xl"         ← Überschreibt max-w-7xl!
+ ui Prop:     (nichts für inner)
= twMerge:     "mx-auto max-w-6xl px-6 py-24"
```

---

## 15. Akzeptanzkriterien

- [ ] `OpComponentTheme` Type mit slots, variants, compoundVariants, defaultVariants
- [ ] `resolveComponentClasses()` merged 5 Layers korrekt
- [ ] `tailwind-merge` Integration für konfliktfreies Merging
- [ ] `useOpThemeClasses()` Composable mit reaktivem Computed-Return
- [ ] app.config.ts Override-Pfad `op.{component}` dokumentiert und typisiert
- [ ] `ui` Prop Pattern auf OpSection und OpSlot
- [ ] Dark Mode via Standard-Tailwind `dark:` Variante
- [ ] CSS Custom Properties für nicht-Klassen Tokens
- [ ] Theme-Registration via `registerTheme()` + Nuxt Module
- [ ] Referenz-Theme `tailwind-plus` mit mindestens Section + Slot Definitionen
- [ ] Alle 12 Unit-Tests grün
- [ ] SSR-kompatibel (synchrone Resolution)
