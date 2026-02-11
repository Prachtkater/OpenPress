<script setup lang="ts">
import { provide, computed, inject } from 'vue'
import { z } from 'zod'
import type { Block } from '@openpress/schemas'
import { BlockSchema } from '@openpress/schemas'
import { OP_SLOT_KEY, OP_SECTION_KEY, type OpSlotContext } from '../keys'
import { useOpMode } from '../composables/useOpMode'
import { useOpThemeClasses } from '../composables/useOpThemeClasses'
import { resolveBlockComponent } from '../blocks/resolve'
import type { Section } from '@openpress/schemas'

export interface OpSlotUI {
  root?: string
  empty?: string
}

const props = defineProps<{
  name: string
  blocks: Block[]
  ui?: OpSlotUI
}>()

// Zod-Validierung im Development
if (import.meta.dev) {
  const blocksResult = z.array(BlockSchema).safeParse(props.blocks)
  if (!blocksResult.success) {
    console.warn(
      `[OpenPress] OpSlot "${props.name}": Ungültige Block-Daten`,
      blocksResult.error.issues,
    )
  }
}

const section = inject<Section>(OP_SECTION_KEY as symbol)
if (!section) {
  throw new Error(
    '[OpenPress] OpSlot muss innerhalb von <OpSection> verwendet werden.',
  )
}

const { isEditing } = useOpMode()

// Theme-Klassen für diesen Slot-Name auflösen
const classes = computed(() =>
  useOpThemeClasses(
    'slot',
    { name: props.name },
    undefined,
    props.ui,
  ),
)

// Provide Slot-Kontext für verschachtelte Blocks
const slotContext = computed<OpSlotContext>(() => ({
  name: props.name,
  sectionId: section.id,
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
