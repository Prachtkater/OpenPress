<script setup lang="ts">
const { data: page, pending: pagePending, error: pageError } = usePage('index')
const { data: site } = useAsyncData('site', () => $fetch('/api/_openpress/site'))
const { data: navigation } = useAsyncData('nav', () => $fetch('/api/_openpress/navigation'))

useHead({
  title: 'Naturgarten Berlin – Ökologische Gartengestaltung & Naturnahe Gärten',
  meta: [
    {
      name: 'description',
      content: 'Naturgarten Berlin gestaltet ökologische Gärten, die Lebensräume für Mensch und Natur schaffen.',
    },
  ],
})
</script>

<template>
  <div v-if="pagePending" class="flex min-h-screen items-center justify-center">
    <p class="text-gray-500">Seite wird geladen...</p>
  </div>
  <div v-else-if="pageError" class="flex min-h-screen items-center justify-center">
    <p class="text-red-500">Fehler beim Laden: {{ pageError.message }}</p>
  </div>
  <OpProvider
    v-else-if="page && site"
    :page="page"
    :site="(site as any)"
    :navigation="(navigation as any)"
  >
    <OpPage :page="page" />
  </OpProvider>
</template>
