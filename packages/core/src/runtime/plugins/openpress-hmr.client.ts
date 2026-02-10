import { defineNuxtPlugin } from '#imports'
import { useContentRefresh } from '../composables/useContentRefresh'
import type { ContentChangePayload } from '../../hmr/types'

/**
 * Dev-only client plugin that listens for OpenPress content changes
 * via the Vite HMR WebSocket and triggers selective data refresh.
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.hot) return

  const { handleChange } = useContentRefresh()

  import.meta.hot.on('openpress:content-change', (payload: ContentChangePayload) => {
    handleChange(payload)
  })
})
