<script setup lang="ts">
import { PageSchema } from '@openpress/schemas'
import type { Page } from '@openpress/schemas'
import OpSection from './OpSection.vue'

const props = defineProps<{
  page: Page
}>()

if (import.meta.dev) {
  const result = PageSchema.safeParse(props.page)
  if (!result.success) {
    console.warn(
      `[OpenPress] OpPage: Invalid page data`,
      result.error.issues,
    )
  }
}
</script>

<template>
  <article
    class="op-page"
    :data-op-page="page.slug"
    :data-op-id="page.id"
  >
    <slot :page="page" :sections="page.sections">
      <OpSection
        v-for="section in page.sections"
        :key="section.id"
        :section="section"
      />
    </slot>
  </article>
</template>
