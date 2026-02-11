<script setup lang="ts">
/**
 * OpenPress Page Editor — /_edit/:slug
 *
 * Renders the page inside an OpEditFrame with:
 * - Tiptap inline editing (via OpInlineEdit in block components)
 * - Floating block toolbar (via OpBlockToolbar)
 * - Content sync: edits → API save → HMR preview refresh
 */
import { watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from '#imports'
import { usePage } from '../../composables/usePage'
import { useContentSync } from '../../composables/useContentSync'

const route = useRoute()
const slug = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : (route.params.slug as string) || 'index'

const { data: page, pending, error } = usePage(slug)

// Content sync is client-only (Tiptap requires DOM).
// Functions must not be exposed as top-level refs to avoid SSR devalue errors.
let _contentSync: ReturnType<typeof useContentSync> | null = null
let _stopSync: (() => void) | null = null

onMounted(() => {
  _contentSync = useContentSync({ debounceMs: 1000 })

  // Wire page data to content sync
  watch(page, (p) => {
    if (p) {
      _contentSync!.setPage(p)
    }
  }, { immediate: true })

  _stopSync = _contentSync.start()
})

// Flush pending saves before navigating away
onBeforeUnmount(async () => {
  if (_contentSync) {
    await _contentSync.flush()
  }
  if (_stopSync) {
    _stopSync()
  }
})
</script>

<template>
  <div class="openpress-edit-page">
    <div v-if="pending" class="openpress-edit-page__loading">
      Loading...
    </div>
    <div v-else-if="error" class="openpress-edit-page__error">
      Failed to load page: {{ error.message }}
    </div>
    <OpEditFrame v-else-if="page">
      <!-- Page sections will be rendered here by OpProvider / OpSection -->
      <slot />
    </OpEditFrame>
  </div>
</template>
