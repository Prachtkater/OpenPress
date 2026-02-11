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
