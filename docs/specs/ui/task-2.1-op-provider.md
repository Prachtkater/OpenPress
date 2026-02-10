# Task 2.1: OpProvider — Global State & Config

**EPIC:** 2 — UI Engine & Component Bridge (Op-System)
**Paket:** `@openpress/ui`
**Pfad:** `packages/ui/src/runtime/components/OpProvider.vue`
**Abhängigkeiten:** `@openpress/schemas`, `@openpress/poc-storage` (Typen)

---

## 1. Zielsetzung

`OpProvider` ist die Root-Komponente des Op-Systems. Sie stellt den gesamten globalen State (Seite, Site-Config, Navigation, Editor-Modus) via `provide/inject` bereit und bildet die Single Source of Truth für alle verschachtelten Op-Komponenten.

**Analogie zu Nuxt UI:** Entspricht der Rolle von `<UApp>` — ein Root-Provider der Theme-Tokens, Locale und globale Config an alle Children durchreicht.

---

## 2. Architektur-Übersicht

```
<OpProvider :page="page" :site="site" :navigation="nav" :editing="false">
  ├── provide('op-page', reactivePageState)
  ├── provide('op-site', reactiveSiteState)
  ├── provide('op-nav', reactiveNavState)
  ├── provide('op-mode', editingRef)
  ├── provide('op-theme', resolvedThemeConfig)
  │
  └── <slot />   ← Hier leben OpSection, OpSlot, OpBlock etc.
</OpProvider>
```

---

## 3. API-Spezifikation

### 3.1 Props

| Prop | Typ | Required | Default | Beschreibung |
|------|-----|----------|---------|-------------|
| `page` | `Page` | ja | — | Die aktuelle Seite (Zod-validiert) |
| `site` | `SiteConfig` | ja | — | Globale Site-Konfiguration |
| `navigation` | `Navigation` | nein | `{ main: [], footer: [] }` | Navigation-Daten |
| `editing` | `boolean` | nein | `false` | Editor-Modus aktiv? |
| `theme` | `string` | nein | aus `site.theme` | Theme-Override (z.B. `'tailwind-plus'`) |

### 3.2 Provide/Inject Keys (InjectionKey\<T\>)

Alle Keys sind typisierte `InjectionKey<T>` aus einer zentralen `keys.ts`:

```typescript
// packages/ui/src/runtime/keys.ts
import type { InjectionKey, Ref, DeepReadonly } from 'vue'
import type { Page, SiteConfig, Navigation } from '@openpress/schemas'
import type { OpThemeConfig } from '../types'

export const OP_PAGE_KEY: InjectionKey<Ref<Page>> = Symbol('op-page')
export const OP_SITE_KEY: InjectionKey<DeepReadonly<Ref<SiteConfig>>> = Symbol('op-site')
export const OP_NAV_KEY: InjectionKey<DeepReadonly<Ref<Navigation>>> = Symbol('op-nav')
export const OP_MODE_KEY: InjectionKey<Ref<'view' | 'edit'>> = Symbol('op-mode')
export const OP_THEME_KEY: InjectionKey<DeepReadonly<Ref<OpThemeConfig>>> = Symbol('op-theme')
```

**Warum `Ref<T>` statt plain Value?**
Reaktivität: Wenn der Editor den State ändert (z.B. Section hinzufügen), propagiert die Änderung sofort durch den gesamten Baum.

**Warum `DeepReadonly` für site/nav?**
Site-Config und Navigation werden nur über explizite Mutations (via Storage Engine) geändert, nie direkt von Children.

### 3.3 Composable: `useOpenPress()`

```typescript
// packages/ui/src/runtime/composables/useOpenPress.ts
export function useOpenPress() {
  const page = inject(OP_PAGE_KEY)
  const site = inject(OP_SITE_KEY)
  const navigation = inject(OP_NAV_KEY)
  const mode = inject(OP_MODE_KEY)
  const theme = inject(OP_THEME_KEY)

  if (!page || !site) {
    throw new Error(
      '[OpenPress] useOpenPress() muss innerhalb von <OpProvider> aufgerufen werden.'
    )
  }

  return {
    page,            // Ref<Page> — mutable im Edit-Modus
    site,            // DeepReadonly<Ref<SiteConfig>>
    navigation,      // DeepReadonly<Ref<Navigation>>
    isEditing: computed(() => mode?.value === 'edit'),
    theme,           // DeepReadonly<Ref<OpThemeConfig>>
  }
}
```

### 3.4 Composable: `useOpMode()`

Schmalerer Zugriff nur auf den Editor-Modus (für Komponenten die nicht den ganzen State brauchen):

```typescript
// packages/ui/src/runtime/composables/useOpMode.ts
export function useOpMode() {
  const mode = inject(OP_MODE_KEY)
  if (!mode) {
    throw new Error('[OpenPress] useOpMode() muss innerhalb von <OpProvider> aufgerufen werden.')
  }
  return {
    mode,
    isEditing: computed(() => mode.value === 'edit'),
  }
}
```

---

## 4. Komponenten-Implementierung

### 4.1 OpProvider.vue

```vue
<script setup lang="ts">
import { provide, toRef, computed, readonly } from 'vue'
import type { Page, SiteConfig, Navigation } from '@openpress/schemas'
import type { OpThemeConfig } from '../types'
import { OP_PAGE_KEY, OP_SITE_KEY, OP_NAV_KEY, OP_MODE_KEY, OP_THEME_KEY } from '../keys'
import { resolveTheme } from '../theme/resolve'

const props = withDefaults(defineProps<{
  page: Page
  site: SiteConfig
  navigation?: Navigation
  editing?: boolean
  theme?: string
}>(), {
  navigation: () => ({ main: [], footer: [] }),
  editing: false,
})

// Reaktive Refs aus Props
const pageRef = toRef(props, 'page')
const siteRef = toRef(props, 'site')
const navRef = toRef(props, 'navigation')
const modeRef = computed<'view' | 'edit'>(() => props.editing ? 'edit' : 'view')

// Theme Resolution: props.theme > site.theme > 'tailwind-plus'
const resolvedTheme = computed<OpThemeConfig>(() => {
  const themeName = props.theme ?? props.site.theme ?? 'tailwind-plus'
  return resolveTheme(themeName)
})

// Provide
provide(OP_PAGE_KEY, pageRef)
provide(OP_SITE_KEY, readonly(siteRef))
provide(OP_NAV_KEY, readonly(navRef))
provide(OP_MODE_KEY, modeRef)
provide(OP_THEME_KEY, readonly(resolvedTheme))
</script>

<template>
  <div class="op-provider" :data-op-mode="modeRef" :data-op-theme="resolvedTheme.name">
    <slot />
  </div>
</template>
```

### 4.2 Data-Attribute Strategie

Das Root-Element exponiert State als `data-*` Attribute:

| Attribut | Werte | Zweck |
|----------|-------|-------|
| `data-op-mode` | `view` / `edit` | CSS-Selektor für Editor-spezifische Styles |
| `data-op-theme` | `tailwind-plus` / `material-expressive` | Theme-Scoping |

**Warum `data-*` statt CSS-Klassen?**
Spezifität-freies Styling — Themes können via `[data-op-theme="tailwind-plus"]` scoped werden, ohne Klassen-Konflikte mit Nuxt UI.

---

## 5. Theme-Resolution

### 5.1 OpThemeConfig Type

```typescript
// packages/ui/src/types.ts
export interface OpThemeConfig {
  name: string                                    // 'tailwind-plus' | 'material-expressive'
  components: Record<string, OpComponentTheme>    // Komponentenspezifische Klassen
}

export interface OpComponentTheme {
  slots: Record<string, string>                   // Slot → Tailwind-Klassen
  variants?: Record<string, Record<string, Record<string, string>>>
  defaultVariants?: Record<string, string>
}
```

### 5.2 resolveTheme()

```typescript
// packages/ui/src/runtime/theme/resolve.ts
const themeRegistry = new Map<string, () => Promise<OpThemeConfig>>()

export function registerTheme(name: string, loader: () => Promise<OpThemeConfig>) {
  themeRegistry.set(name, loader)
}

export function resolveTheme(name: string): OpThemeConfig {
  // Synchrone Resolution für SSR — Themes werden beim Build aufgelöst
  // Fallback auf ein leeres Default-Theme
  return resolvedCache.get(name) ?? { name, components: {} }
}
```

Themes registrieren sich selbst via Nuxt-Plugin:

```typescript
// packages/theme-tailwind-plus/src/plugin.ts
import { registerTheme } from '@openpress/ui'

registerTheme('tailwind-plus', () => import('./theme'))
```

---

## 6. Datei-Struktur

```
packages/ui/src/
├── runtime/
│   ├── components/
│   │   └── OpProvider.vue
│   ├── composables/
│   │   ├── useOpenPress.ts
│   │   └── useOpMode.ts
│   ├── keys.ts                  ← InjectionKeys
│   └── theme/
│       └── resolve.ts           ← Theme-Registry & Resolution
├── types.ts                     ← OpThemeConfig, OpComponentTheme
└── index.ts                     ← Re-Exports
```

---

## 7. Validierung & Error Handling

### 7.1 Prop-Validierung

Props werden **nicht** nochmal mit Zod validiert — die Validierung passiert an der Systemgrenze (Storage Engine → API Route → Page-Loader). OpProvider vertraut internem Code.

### 7.2 Missing Provider Error

Alle Composables werfen einen deskriptiven Error, wenn sie außerhalb von `<OpProvider>` verwendet werden. Dies ist ein Developer-facing Error, kein Runtime-Fallback.

---

## 8. Nuxt-Integration

OpProvider wird vom `@openpress/core` Modul automatisch registriert:

```typescript
// packages/core/src/module.ts (relevant excerpt)
export default defineNuxtModule({
  setup(options, nuxt) {
    // Auto-Import der Op-Komponenten
    addComponent({
      name: 'OpProvider',
      filePath: resolve('./runtime/components/OpProvider.vue'),
    })
    // Auto-Import der Composables
    addImports([
      { name: 'useOpenPress', from: resolve('./runtime/composables/useOpenPress') },
      { name: 'useOpMode', from: resolve('./runtime/composables/useOpMode') },
    ])
  }
})
```

---

## 9. Nutzungsbeispiel

```vue
<!-- pages/[slug].vue -->
<script setup>
const { page, site, navigation } = await usePageData()
</script>

<template>
  <OpProvider :page="page" :site="site" :navigation="navigation" :editing="route.path.startsWith('/_edit')">
    <OpSection
      v-for="section in page.sections"
      :key="section.id"
      :section="section"
    />
  </OpProvider>
</template>
```

---

## 10. Testplan

| Test | Beschreibung | Typ |
|------|-------------|-----|
| Provider liefert Page | `useOpenPress().page` gibt die Prop-Page zurück | Unit |
| Provider liefert Site | `useOpenPress().site` gibt die Prop-SiteConfig zurück | Unit |
| Mode-Reaktivität | `editing=true` → `isEditing` wird `true` | Unit |
| Missing Provider Error | `useOpenPress()` außerhalb von OpProvider wirft Error | Unit |
| Theme-Fallback | Ohne theme-Prop wird `site.theme` verwendet | Unit |
| Default Navigation | Ohne navigation-Prop: `{ main: [], footer: [] }` | Unit |
| Data-Attribute | Root-Element hat `data-op-mode` und `data-op-theme` | Unit |
| Readonly Enforcement | `site` und `navigation` sind nicht direkt mutierbar | Unit |

---

## 11. Akzeptanzkriterien

- [ ] OpProvider stellt Page, Site, Navigation, Mode und Theme via provide/inject bereit
- [ ] `useOpenPress()` Composable funktioniert in allen Child-Komponenten
- [ ] `useOpMode()` Composable als schlanke Alternative
- [ ] Editor-Modus über `editing` Prop steuerbar
- [ ] Theme-Resolution mit Fallback-Chain: prop → site.theme → 'tailwind-plus'
- [ ] Typisierte InjectionKeys in zentraler `keys.ts`
- [ ] Data-Attribute für CSS-Scoping auf dem Root-Element
- [ ] Alle 8 Unit-Tests grün
