<script setup lang="ts">
import { provide, computed, inject, isRef, ref, type ComputedRef, type Ref } from 'vue'
import { z } from 'zod'
import type { Block, Section } from '@openpress/schemas'
import { BlockSchema } from '@openpress/schemas'
import type { OpThemeConfig, OpSlotContext } from '@openpress/ui'
import {
  OP_SLOT_KEY,
  OP_SECTION_KEY,
  OP_MODE_KEY,
  OP_THEME_KEY,
  resolveBlockComponent,
  resolveComponentClasses,
} from '@openpress/ui'

export interface OpSlotUI {
  root?: string
  empty?: string
}

const props = defineProps<{
  name: string
  blocks: Block[]
  ui?: OpSlotUI
}>()

if (import.meta.dev) {
  const blocksResult = z.array(BlockSchema).safeParse(props.blocks)
  if (!blocksResult.success) {
    console.warn(
      `[OpenPress] OpSlot "${props.name}": Invalid block data`,
      blocksResult.error.issues,
    )
  }
}

const rawSection = inject<Ref<Section> | Section>(OP_SECTION_KEY as symbol)
if (!rawSection) {
  throw new Error(
    '[OpenPress] OpSlot must be used inside <OpSection>.',
  )
}
const section: Ref<Section> = isRef(rawSection) ? rawSection : ref(rawSection) as Ref<Section>

const mode = inject<ComputedRef<'view' | 'edit'>>(OP_MODE_KEY as symbol)
const isEditing = computed(() => mode?.value === 'edit')
const theme = inject<ComputedRef<Readonly<OpThemeConfig>>>(OP_THEME_KEY as symbol)

const classes = computed(() => {
  const componentTheme = theme?.value?.components?.slot
  if (!componentTheme) return {}
  return resolveComponentClasses(
    componentTheme,
    { name: props.name },
    undefined,
    props.ui,
  )
})

const slotContext = computed<OpSlotContext>(() => ({
  name: props.name,
  sectionId: section.value?.id ?? '',
}))
provide(OP_SLOT_KEY as symbol, slotContext)
</script>

<template>
  <div
    :class="classes.root"
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

    <div
      v-else-if="isEditing"
      :class="classes.empty"
      data-op-empty-slot
    >
      <slot name="empty" />
    </div>
  </div>
</template>
