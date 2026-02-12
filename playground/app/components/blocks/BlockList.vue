<script setup lang="ts">
import type { Block } from '@openpress/schemas'

const props = defineProps<{ block: Block }>()
const items = (props.block.props.items as string[]) || []
const variant = (props.block.props.variant as string) || 'bullet'
</script>

<template>
  <ul :class="variant === 'check' ? 'space-y-2' : 'list-disc pl-5 space-y-1'">
    <li v-for="(item, i) in items" :key="i" class="flex items-start gap-2">
      <span v-if="variant === 'check'" class="mt-0.5 text-green-600">&#10003;</span>
      <span>{{ item }}</span>
    </li>
  </ul>
</template>
