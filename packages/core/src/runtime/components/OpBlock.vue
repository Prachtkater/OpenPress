<script setup lang="ts">
import { BlockSchema } from '@openpress/schemas'
import type { Block } from '@openpress/schemas'
import { resolveBlockComponent } from '@openpress/ui'

const props = defineProps<{
  block: Block
}>()

if (import.meta.dev) {
  const result = BlockSchema.safeParse(props.block)
  if (!result.success) {
    console.warn(
      `[OpenPress] OpBlock: Invalid block data`,
      result.error.issues,
    )
  }
}

const resolved = resolveBlockComponent(props.block.type)
</script>

<template>
  <component
    :is="resolved"
    :block="block"
    :data-op-block="block.type"
    :data-op-id="block.id"
  />
</template>
