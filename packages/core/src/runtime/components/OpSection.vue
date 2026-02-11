<script setup lang="ts">
import { provide, toRef, computed } from 'vue'
import { SectionSchema } from '@openpress/schemas'
import type { Section } from '@openpress/schemas'
import { OP_SECTION_KEY, useOpMode, useOpThemeClasses } from '@openpress/ui'
import OpSlot from './OpSlot.vue'

export interface OpSectionUI {
  root?: string
  inner?: string
}

const props = defineProps<{
  section: Section
  ui?: OpSectionUI
}>()

if (import.meta.dev) {
  const result = SectionSchema.safeParse(props.section)
  if (!result.success) {
    console.warn(
      `[OpenPress] OpSection: Invalid section data`,
      result.error.issues,
    )
  }
}

const sectionRef = toRef(props, 'section')
const { isEditing } = useOpMode()

const classes = computed(() =>
  useOpThemeClasses(
    'section',
    { type: props.section.type },
    undefined,
    props.ui,
  ),
)

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
