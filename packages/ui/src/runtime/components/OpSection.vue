<script setup lang="ts">
import { provide, toRef, computed } from 'vue'
import { SectionSchema } from '@openpress/schemas'
import type { Section, Block } from '@openpress/schemas'
import { OP_SECTION_KEY } from '../keys'
import { useOpMode } from '../composables/useOpMode'
import { useOpThemeClasses } from '../composables/useOpThemeClasses'

export interface OpSectionUI {
  root?: string
  inner?: string
}

const props = defineProps<{
  section: Section
  ui?: OpSectionUI
}>()

// Zod-Validierung im Development
if (import.meta.dev) {
  const result = SectionSchema.safeParse(props.section)
  if (!result.success) {
    console.warn(
      `[OpenPress] OpSection: Ungültige Section-Daten`,
      result.error.issues,
    )
  }
}

const sectionRef = toRef(props, 'section')
const { isEditing } = useOpMode()

// Theme-Klassen für diesen Section-Type auflösen
const classes = computed(() =>
  useOpThemeClasses(
    'section',
    { type: props.section.type },
    undefined,
    props.ui,
  ),
)

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
        Option A: Named Slots für Theme-Kontrolle (Scoped Slot Override)
        Option B: Automatisches Rendering aller Section-Slots
        → Default: Option B, mit Option A als Override via Scoped Slot
      -->
      <slot :section="section" :slots="section.slots">
        <!-- Default: Rendere alle Slots der Section automatisch -->
        <OpSlot
          v-for="(blocks, slotName) in section.slots"
          :key="slotName"
          :name="String(slotName)"
          :blocks="blocks"
        />
      </slot>
    </div>
  </section>
</template>
