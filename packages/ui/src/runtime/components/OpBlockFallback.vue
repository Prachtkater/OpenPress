<script setup lang="ts">
import { inject, computed, type ComputedRef } from 'vue'
import { BlockSchema } from '@openpress/schemas'
import type { Block } from '@openpress/schemas'
import { OP_MODE_KEY } from '../keys'

const props = defineProps<{ block: Block }>()

// Zod-Validierung im Development
if (import.meta.dev) {
  const result = BlockSchema.safeParse(props.block)
  if (!result.success) {
    console.warn(
      `[OpenPress] OpBlockFallback: Ungültige Block-Daten`,
      result.error.issues,
    )
  }
}

const mode = inject<ComputedRef<'view' | 'edit'>>(OP_MODE_KEY as symbol)
const isEditing = computed(() => mode?.value === 'edit')
</script>

<template>
  <div
    v-if="isEditing"
    class="op-block-fallback rounded-lg border border-dashed border-amber-300/60 bg-amber-50/40 px-4 py-3 text-sm text-amber-700 backdrop-blur-sm dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-400"
    data-op-fallback
    :data-op-block="block.type"
    :data-op-id="block.id"
  >
    <span class="font-medium">Unbekannter Block-Typ:</span> {{ block.type }}
  </div>
</template>
