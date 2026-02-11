<script setup lang="ts">
import type { Block } from '@openpress/schemas'

const props = defineProps<{ block: Block }>()
const variant = (props.block.props.variant as string) || 'primary'
</script>

<template>
  <a
    :href="(block.props.href as string)"
    :class="[
      'inline-block rounded-lg px-6 py-3 font-semibold transition-all',
      variant === 'primary'
        ? 'bg-green-700 text-white hover:bg-green-800 shadow-lg shadow-green-700/25'
        : 'border border-white/40 text-inherit hover:bg-white/10 backdrop-blur-sm',
    ]"
  >
    {{ block.props.text }}
  </a>
</template>
