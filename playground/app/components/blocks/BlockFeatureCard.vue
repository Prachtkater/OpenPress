<script setup lang="ts">
import type { Block } from '@openpress/schemas'

defineProps<{ block: Block }>()
</script>

<template>
  <div class="rounded-2xl border border-white/20 bg-white/50 p-6 backdrop-blur-lg shadow-xl ring-1 ring-white/30 dark:bg-gray-900/50 dark:ring-white/10">
    <div class="mb-3 text-3xl">
      {{ block.props.icon === 'leaf' ? '🌿' : block.props.icon === 'flower' ? '🌸' : block.props.icon === 'droplet' ? '💧' : '♻️' }}
    </div>
    <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{{ block.props.title }}</h3>
    <p class="text-sm text-gray-600 dark:text-gray-300">{{ block.props.description }}</p>
  </div>
</template>
