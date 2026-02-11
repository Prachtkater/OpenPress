<script setup lang="ts">
import { provide, computed, inject } from 'vue'
import { z } from 'zod'
import type { Block, Section } from '@openpress/schemas'
import { BlockSchema } from '@openpress/schemas'
import {
  OP_SLOT_KEY,
  OP_SECTION_KEY,
  type OpSlotContext,
  useOpMode,
  useOpThemeClasses,
  resolveBlockComponent,
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

const section = inject<Section>(OP_SECTION_KEY as symbol)
if (!section) {
  throw new Error(
    '[OpenPress] OpSlot must be used inside <OpSection>.',
  )
}

const { isEditing } = useOpMode()

const classes = computed(() =>
  useOpThemeClasses(
    'slot',
    { name: props.name },
    undefined,
    props.ui,
  ),
)

const slotContext = computed<OpSlotContext>(() => ({
  name: props.name,
  sectionId: section.id,
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
