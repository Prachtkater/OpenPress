# Task 2.2: OpSection & OpSlot — Basis-Komponenten

**EPIC:** 2 — UI Engine & Component Bridge (Op-System)
**Paket:** `@openpress/ui`
**Pfad:** `packages/ui/src/runtime/components/`
**Abhängigkeiten:** Task 2.1 (OpProvider), `@openpress/schemas`

---

## 1. Zielsetzung

`OpSection` und `OpSlot` bilden das Composition-System von OpenPress. Jede Seite besteht aus Sections, die Slots enthalten, die wiederum Blocks aufnehmen. Diese Komponenten sind die strukturellen Bausteine — sie definieren **Layout**, nicht **Inhalt**.

```
Page
 └── OpSection (type: "hero")
 │    ├── OpSlot (name: "default")
 │    │    ├── OpBlock (type: "rich-text")
 │    │    └── OpBlock (type: "button")
 │    └── OpSlot (name: "media")
 │         └── OpBlock (type: "image")
 └── OpSection (type: "features")
      └── OpSlot (name: "default")
           ├── OpBlock (type: "card")
           ├── OpBlock (type: "card")
           └── OpBlock (type: "card")
```

---

## 2. Schema-Referenz

Aus `@openpress/schemas`:

```typescript
// section.ts
SectionSchema = z.object({
  id: z.string().ulid(),
  type: z.string().min(1),           // "hero", "features", "cta", ...
  slots: z.record(SlotSchema),       // { "default": [...blocks], "sidebar": [...blocks] }
})

// block.ts
SlotSchema = z.array(BlockSchema)    // Geordnetes Array von Blocks
BlockSchema = z.object({
  id: z.string().ulid(),
  type: z.string().min(1),           // "rich-text", "image", "button", ...
  props: z.record(z.unknown()),      // Block-spezifische Properties
})
```

---

## 3. OpSection

### 3.1 Verantwortung

- Rendert einen semantischen Container für eine Section
- Löst den Section-Type auf eine Theme-Komponente oder ein Fallback-Layout auf
- Stellt Section-Kontext via `provide` bereit
- Im Edit-Modus: Exponiert Interaktions-Hooks (Hover, Select, Drag-Handle)

### 3.2 Props

| Prop | Typ | Required | Default | Beschreibung |
|------|-----|----------|---------|-------------|
| `section` | `Section` | ja | — | Section-Daten aus dem Page-Schema |
| `ui` | `OpSectionUI` | nein | `{}` | Klassen-Overrides (Nuxt UI Pattern) |

### 3.3 InjectionKey

```typescript
// keys.ts (Ergänzung zu Task 2.1)
export const OP_SECTION_KEY: InjectionKey<Ref<Section>> = Symbol('op-section')
```

### 3.4 Composable: `useOpSection()`

```typescript
// packages/ui/src/runtime/composables/useOpSection.ts
export function useOpSection() {
  const section = inject(OP_SECTION_KEY)
  if (!section) {
    throw new Error('[OpenPress] useOpSection() muss innerhalb von <OpSection> aufgerufen werden.')
  }
  return { section }
}
```

### 3.5 Komponente

```vue
<script setup lang="ts">
import { provide, toRef, computed } from 'vue'
import type { Section } from '@openpress/schemas'
import { OP_SECTION_KEY } from '../keys'
import { useOpMode } from '../composables/useOpMode'
import { useOpThemeClasses } from '../composables/useOpThemeClasses'

interface OpSectionUI {
  root?: string
  inner?: string
}

const props = defineProps<{
  section: Section
  ui?: OpSectionUI
}>()

const sectionRef = toRef(props, 'section')
const { isEditing } = useOpMode()

// Theme-Klassen für diesen Section-Type auflösen
const classes = useOpThemeClasses('section', props.section.type)

// Provide Section-Kontext für verschachtelte OpSlots
provide(OP_SECTION_KEY, sectionRef)
</script>

<template>
  <section
    :class="[classes.root, ui?.root]"
    :data-op-section="section.type"
    :data-op-id="section.id"
    :data-op-editing="isEditing ? '' : undefined"
  >
    <div :class="[classes.inner, ui?.inner]">
      <!--
        Option A: Named Slots für Theme-Kontrolle
        Option B: Automatisches Rendering aller Section-Slots
        → Wir verwenden Option B als Default mit Option A als Override
      -->
      <slot :section="section" :slots="section.slots">
        <!-- Default: Rendere alle Slots der Section automatisch -->
        <OpSlot
          v-for="(blocks, slotName) in section.slots"
          :key="slotName"
          :name="slotName"
          :blocks="blocks"
        />
      </slot>
    </div>
  </section>
</template>
```

### 3.6 Rendering-Strategie

OpSection hat **zwei Modi**:

1. **Auto-Rendering (Default):** Iteriert über `section.slots` und rendert für jeden einen `<OpSlot>`. Funktioniert ohne Theme-Customization.

2. **Manuelles Rendering (Scoped Slot):** Themes können den Default-Slot überschreiben und die Slots manuell platzieren:

```vue
<!-- theme-tailwind-plus/components/sections/HeroSection.vue -->
<template>
  <OpSection :section="section">
    <template #default="{ slots }">
      <div class="grid grid-cols-2 gap-8">
        <OpSlot name="default" :blocks="slots.default" />
        <OpSlot name="media" :blocks="slots.media" />
      </div>
    </template>
  </OpSection>
</template>
```

### 3.7 Data-Attribute

| Attribut | Wert | Zweck |
|----------|------|-------|
| `data-op-section` | Section-Type (`"hero"`, `"features"`) | Theme-Scoping via CSS |
| `data-op-id` | ULID | Identifikation für Editor-Overlay |
| `data-op-editing` | (present/absent) | Editor-spezifische Styles |

---

## 4. OpSlot

### 4.1 Verantwortung

- Rendert einen Container für eine geordnete Liste von Blocks
- Löst Block-Types auf registrierte Komponenten auf
- Im Edit-Modus: Drop-Zone für Drag & Drop, "Block hinzufügen"-Trigger

### 4.2 Props

| Prop | Typ | Required | Default | Beschreibung |
|------|-----|----------|---------|-------------|
| `name` | `string` | ja | — | Slot-Name (z.B. `"default"`, `"sidebar"`) |
| `blocks` | `Block[]` | ja | — | Geordnete Block-Liste |
| `ui` | `OpSlotUI` | nein | `{}` | Klassen-Overrides |

### 4.3 InjectionKey

```typescript
// keys.ts (Ergänzung)
export interface OpSlotContext {
  name: string
  sectionId: string
}
export const OP_SLOT_KEY: InjectionKey<Ref<OpSlotContext>> = Symbol('op-slot')
```

### 4.4 Composable: `useOpSlot()`

```typescript
// packages/ui/src/runtime/composables/useOpSlot.ts
export function useOpSlot() {
  const slot = inject(OP_SLOT_KEY)
  if (!slot) {
    throw new Error('[OpenPress] useOpSlot() muss innerhalb von <OpSlot> aufgerufen werden.')
  }
  return { slot }
}
```

### 4.5 Komponente

```vue
<script setup lang="ts">
import { provide, computed, ref } from 'vue'
import type { Block } from '@openpress/schemas'
import { OP_SLOT_KEY, type OpSlotContext } from '../keys'
import { useOpSection } from '../composables/useOpSection'
import { useOpMode } from '../composables/useOpMode'
import { useOpThemeClasses } from '../composables/useOpThemeClasses'
import { resolveBlockComponent } from '../blocks/resolve'

interface OpSlotUI {
  root?: string
  empty?: string
}

const props = defineProps<{
  name: string
  blocks: Block[]
  ui?: OpSlotUI
}>()

const { section } = useOpSection()
const { isEditing } = useOpMode()
const classes = useOpThemeClasses('slot', props.name)

// Provide Slot-Kontext
const slotContext = computed<OpSlotContext>(() => ({
  name: props.name,
  sectionId: section.value.id,
}))
provide(OP_SLOT_KEY, slotContext)
</script>

<template>
  <div
    :class="[classes.root, ui?.root]"
    :data-op-slot="name"
    :data-op-editing="isEditing ? '' : undefined"
  >
    <template v-if="blocks.length > 0">
      <component
        v-for="block in blocks"
        :key="block.id"
        :is="resolveBlockComponent(block.type)"
        :block="block"
        :data-op-block="block.type"
        :data-op-id="block.id"
      />
    </template>

    <!-- Leerer Slot: Sichtbar im Edit-Modus -->
    <div
      v-else-if="isEditing"
      :class="[classes.empty, ui?.empty]"
      data-op-empty-slot
    >
      <slot name="empty">
        <!-- Default: Platzhalter für "Block hinzufügen" -->
      </slot>
    </div>
  </div>
</template>
```

---

## 5. Block-Resolution

### 5.1 Block-Registry

Blocks werden über eine zentrale Registry aufgelöst. Themes und Features registrieren ihre Block-Komponenten:

```typescript
// packages/ui/src/runtime/blocks/resolve.ts
import { defineAsyncComponent, type Component } from 'vue'

const blockRegistry = new Map<string, Component>()

// Fallback-Komponente für unbekannte Block-Types
const OpBlockFallback = defineAsyncComponent(
  () => import('../components/OpBlockFallback.vue')
)

export function registerBlock(type: string, component: Component) {
  blockRegistry.set(type, component)
}

export function resolveBlockComponent(type: string): Component {
  return blockRegistry.get(type) ?? OpBlockFallback
}
```

### 5.2 OpBlockFallback.vue

Rendert im View-Modus nichts. Im Edit-Modus zeigt es den Block-Type als Warnung an:

```vue
<script setup lang="ts">
import type { Block } from '@openpress/schemas'
import { useOpMode } from '../composables/useOpMode'

defineProps<{ block: Block }>()
const { isEditing } = useOpMode()
</script>

<template>
  <div v-if="isEditing" class="op-block-fallback" data-op-fallback>
    Unbekannter Block-Typ: {{ block.type }}
  </div>
</template>
```

---

## 6. Provide/Inject Hierarchie (Gesamtbild)

```
OpProvider
│  provides: OP_PAGE_KEY, OP_SITE_KEY, OP_NAV_KEY, OP_MODE_KEY, OP_THEME_KEY
│
└── OpSection
    │  injects:  OP_MODE_KEY, OP_THEME_KEY
    │  provides: OP_SECTION_KEY
    │
    └── OpSlot
        │  injects:  OP_SECTION_KEY, OP_MODE_KEY, OP_THEME_KEY
        │  provides: OP_SLOT_KEY
        │
        └── OpBlock (resolved component)
             injects: OP_SLOT_KEY, OP_SECTION_KEY, OP_MODE_KEY
```

---

## 7. Edit-Modus Verhalten

### 7.1 OpSection im Edit-Modus

| Feature | Beschreibung | Implementiert in |
|---------|-------------|-----------------|
| Hover-Outline | Blaue Outline beim Hover | CSS via `[data-op-editing]:hover` |
| Selection | Click selektiert die Section | EPIC 3 (Glow Frame) |
| Drag-Handle | Handle zum Umsortieren | EPIC 3 (Glow Frame) |
| Add-Button | "Section hinzufügen" zwischen Sections | EPIC 3 (Glow Frame) |

**Wichtig:** OpSection und OpSlot liefern nur die `data-*` Attribute und den Kontext. Die tatsächliche Editor-Interaktion (Overlays, Drag & Drop, Toolbar) wird in EPIC 3 implementiert. Die Basis-Komponenten hier sind absichtlich edit-mode-**aware** aber nicht edit-mode-**implementing**.

### 7.2 OpSlot im Edit-Modus

| Feature | Beschreibung |
|---------|-------------|
| Drop-Zone | Akzeptiert Blocks via Drag & Drop |
| Empty-State | Zeigt Platzhalter wenn leer |
| Add-Trigger | UI-Hook für "Block hinzufügen" |

---

## 8. Datei-Struktur

```
packages/ui/src/runtime/
├── components/
│   ├── OpProvider.vue          ← Task 2.1
│   ├── OpSection.vue           ← Dieser Task
│   ├── OpSlot.vue              ← Dieser Task
│   └── OpBlockFallback.vue     ← Dieser Task
├── composables/
│   ├── useOpenPress.ts         ← Task 2.1
│   ├── useOpMode.ts            ← Task 2.1
│   ├── useOpSection.ts         ← Dieser Task
│   ├── useOpSlot.ts            ← Dieser Task
│   └── useOpThemeClasses.ts    ← Task 2.3
├── blocks/
│   └── resolve.ts              ← Block-Registry
├── keys.ts                     ← Alle InjectionKeys
└── theme/
    └── resolve.ts              ← Task 2.1
```

---

## 9. Nuxt-Integration

Alle Komponenten werden vom Core-Modul auto-registriert:

```typescript
// packages/core/src/module.ts (relevant excerpt)
const components = ['OpProvider', 'OpSection', 'OpSlot', 'OpBlockFallback']

for (const name of components) {
  addComponent({
    name,
    filePath: resolve(`./runtime/components/${name}.vue`),
  })
}

const composables = ['useOpenPress', 'useOpMode', 'useOpSection', 'useOpSlot']

addImports(
  composables.map(name => ({
    name,
    from: resolve(`./runtime/composables/${name}`),
  }))
)
```

---

## 10. Nutzungsbeispiel

### Minimal (Auto-Rendering)

```vue
<template>
  <OpProvider :page="page" :site="site">
    <OpSection
      v-for="section in page.sections"
      :key="section.id"
      :section="section"
    />
  </OpProvider>
</template>
```

### Mit Theme-Override (Manuelles Layout)

```vue
<!-- theme-tailwind-plus/sections/OpHero.vue -->
<template>
  <OpSection :section="section">
    <template #default="{ slots }">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <OpSlot name="default" :blocks="slots.default ?? []" />
          <OpSlot name="media" :blocks="slots.media ?? []" />
        </div>
      </div>
    </template>
  </OpSection>
</template>
```

### Block-Registrierung

```typescript
// packages/core/src/runtime/blocks/index.ts
import { registerBlock } from '@openpress/ui'
import OpRichText from './OpRichText.vue'
import OpImage from './OpImage.vue'
import OpButton from './OpButton.vue'

registerBlock('rich-text', OpRichText)
registerBlock('image', OpImage)
registerBlock('button', OpButton)
```

---

## 11. Testplan

| Test | Beschreibung | Typ |
|------|-------------|-----|
| Section rendert Slots | Section mit 2 Slots → 2 OpSlot Kinder | Unit |
| Section provide | `useOpSection()` in Kind gibt Section zurück | Unit |
| Section data-Attribute | `data-op-section`, `data-op-id` vorhanden | Unit |
| Slot rendert Blocks | Slot mit 3 Blocks → 3 Block-Komponenten | Unit |
| Slot Empty State | Leerer Slot im Edit-Modus zeigt Platzhalter | Unit |
| Slot Hidden wenn leer | Leerer Slot im View-Modus rendert nichts extra | Unit |
| Block Fallback | Unbekannter Block-Type → OpBlockFallback | Unit |
| Block Registry | `registerBlock()` + `resolveBlockComponent()` | Unit |
| Scoped Slot Override | Theme kann Section-Layout überschreiben | Unit |
| Inject Hierarchie | Section → Slot → Block: Korrekte Kontexte | Integration |

---

## 12. Akzeptanzkriterien

- [ ] OpSection rendert semantisches `<section>` Element mit data-Attributen
- [ ] OpSection stellt Section-Kontext via provide/inject bereit
- [ ] OpSlot rendert Blocks in der richtigen Reihenfolge
- [ ] OpSlot zeigt Empty-State nur im Edit-Modus
- [ ] Block-Registry löst Types auf registrierte Komponenten auf
- [ ] OpBlockFallback für unbekannte Block-Types
- [ ] Scoped-Slot Pattern ermöglicht Theme-spezifische Layouts
- [ ] `useOpSection()` und `useOpSlot()` Composables funktionieren
- [ ] `ui` Prop für Klassen-Overrides (Nuxt UI Pattern)
- [ ] Alle 10 Unit/Integration-Tests grün
