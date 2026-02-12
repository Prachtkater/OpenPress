<script setup lang="ts">
import { provide, inject, toRef, computed, type ComputedRef } from 'vue'
import { SectionSchema } from '@openpress/schemas'
import type { Section, Block } from '@openpress/schemas'
import type { OpThemeConfig } from '../../types'
import { OP_SECTION_KEY, OP_MODE_KEY, OP_THEME_KEY } from '../keys'
import { resolveComponentClasses } from '../theme/resolve-classes'
import OpSlot from './OpSlot.vue'

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
const mode = inject<ComputedRef<'view' | 'edit'>>(OP_MODE_KEY as symbol)
const isEditing = computed(() => mode?.value === 'edit')
const theme = inject<ComputedRef<Readonly<OpThemeConfig>>>(OP_THEME_KEY as symbol)

// Theme-Klassen für diesen Section-Type auflösen
const classes = computed(() => {
  const componentTheme = theme?.value?.components?.section
  if (!componentTheme) return {}
  return resolveComponentClasses(
    componentTheme,
    { type: props.section.type },
    undefined,
    props.ui,
  )
})

// Provide Section-Kontext für verschachtelte OpSlots
provide(OP_SECTION_KEY as symbol, sectionRef)
</script>

<template>
  <section
    :class="classes.root"
    :data-op-section="section.type"
    :data-op-id="section.id"
    :data-op-editing="isEditing ? '' : undefined"
  >
    <div :class="classes.inner">
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
