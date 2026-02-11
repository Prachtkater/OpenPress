<script setup lang="ts">
import { computed } from 'vue'
import { PageSchema } from '@openpress/schemas'
import type { Page } from '@openpress/schemas'
import OpSection from './OpSection.vue'

const props = defineProps<{
  page: Page
}>()

// Zod-Validierung im Development
if (import.meta.dev) {
  const result = PageSchema.safeParse(props.page)
  if (!result.success) {
    console.warn(
      `[OpenPress] OpPage: Ungültige Page-Daten`,
      result.error.issues,
    )
  }
}

const sections = computed(() => props.page.sections)
</script>

<template>
  <article
    class="op-page"
    :data-op-page="page.slug"
    :data-op-id="page.id"
  >
    <slot :page="page" :sections="sections">
      <!-- Default: Rendere alle Sections der Page automatisch -->
      <OpSection
        v-for="section in sections"
        :key="section.id"
        :section="section"
      />
    </slot>
  </article>
</template>
