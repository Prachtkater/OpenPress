<script setup lang="ts">
import type { Block } from '@openpress/schemas'

defineProps<{ block: Block }>()
</script>

<template>
  <p>{{ block.props.text }}</p>
</template>
