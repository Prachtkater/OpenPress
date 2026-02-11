<script setup lang="ts">
import type { Block } from '@openpress/schemas'

defineProps<{ block: Block }>()
</script>

<template>
  <div class="rounded-lg border border-gray-200/60 bg-white/30 p-4 backdrop-blur-sm dark:border-gray-700/40 dark:bg-gray-800/30">
    <div class="mb-1 text-xs font-mono text-gray-400">{{ block.type }}</div>
    <div v-for="(value, key) in block.props" :key="String(key)" class="text-sm text-gray-700 dark:text-gray-300">
      <template v-if="typeof value === 'string'">{{ value }}</template>
      <template v-else-if="Array.isArray(value)">
        <ul class="list-disc pl-4">
          <li v-for="(item, i) in value" :key="i">{{ item }}</li>
        </ul>
      </template>
    </div>
  </div>
</template>
