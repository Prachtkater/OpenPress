<script setup lang="ts">
import type { Block } from '@openpress/schemas'

const props = defineProps<{ block: Block }>()
const level = (props.block.props.level as number) || 2
const text = (props.block.props.text as string) || ''
</script>

<template>
  <component :is="`h${level}`">{{ text }}</component>
</template>
