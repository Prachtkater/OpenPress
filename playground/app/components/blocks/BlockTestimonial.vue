<script setup lang="ts">
import type { Block } from '@openpress/schemas'

defineProps<{ block: Block }>()
</script>

<template>
  <blockquote class="rounded-2xl border border-white/20 bg-white/40 p-6 backdrop-blur-lg shadow-lg ring-1 ring-white/20 dark:bg-gray-800/40 dark:ring-white/10">
    <p class="mb-4 text-gray-700 italic dark:text-gray-200">"{{ block.props.quote }}"</p>
    <footer class="text-sm font-medium text-gray-900 dark:text-white">
      {{ block.props.author }}
      <span v-if="block.props.location" class="text-gray-500 dark:text-gray-400">
        &mdash; {{ block.props.location }}
      </span>
    </footer>
  </blockquote>
</template>
