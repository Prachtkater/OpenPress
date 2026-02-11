import { useState, useRuntimeConfig, refreshNuxtData } from '#imports'
import { useTiptapBridge } from './useTiptapBridge'
import { useEditor } from './useEditor'
import type { BlockContentUpdate } from './useTiptapBridge'
import type { Page, Section, Block } from '@openpress/schemas'

export interface ContentSyncOptions {
  /** Debounce interval in ms for auto-save (default: 1000) */
  debounceMs?: number
}

interface PendingUpdate {
  pageSlug: string
  blockId: string
  sectionId: string
  slotName: string
  content: unknown
  html: string
  timestamp: number
}

/**
 * useContentSync — Composable that bridges inline Tiptap edits to the server.
 *
 * Listens for content updates from useTiptapBridge, debounces them,
 * and persists changes via the PUT /api/_openpress/pages/:slug endpoint.
 * After a successful save, the HMR system picks up the file change
 * and refreshes the preview automatically.
 *
 * Flow:
 * 1. Tiptap editor fires onUpdate → emitContentUpdate
 * 2. useTiptapBridge dispatches BlockContentUpdate to registered handlers
 * 3. useContentSync receives the update, patches the local page state
 * 4. Debounced save sends updated page JSON to the server
 * 5. Server writes JSON file → Vite watcher → HMR → preview refresh
 */
export function useContentSync(options: ContentSyncOptions = {}) {
  const debounceMs = options.debounceMs ?? 1000

  const { onContentUpdate } = useTiptapBridge()
  const { isDirty } = useEditor()
  const isSaving = useState<boolean>('openpress:sync:saving', () => false)
  const lastError = useState<string | null>('openpress:sync:error', () => null)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let pendingUpdate: PendingUpdate | null = null
  let currentPage: Page | null = null
  let unregisterHandler: (() => void) | null = null

  /**
   * Set the current page data that edits will be applied to.
   * Must be called when the page loads or refreshes.
   */
  function setPage(page: Page) {
    currentPage = page
  }

  /**
   * Apply a content update to the in-memory page state.
   * Finds the matching block and updates its props.content.
   */
  function applyUpdate(update: BlockContentUpdate): Page | null {
    if (!currentPage) return null

    const updatedSections = currentPage.sections.map((section: Section) => {
      if (section.id !== update.sectionId) return section

      const updatedSlots: Record<string, Block[]> = {}
      for (const [slotName, blocks] of Object.entries(section.slots)) {
        if (slotName !== update.slotName) {
          updatedSlots[slotName] = blocks
          continue
        }
        updatedSlots[slotName] = blocks.map((block: Block) => {
          if (block.id !== update.blockId) return block
          return {
            ...block,
            props: {
              ...block.props,
              content: update.content,
            },
          }
        })
      }

      return { ...section, slots: updatedSlots }
    })

    currentPage = {
      ...currentPage,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    }

    return currentPage
  }

  /**
   * Save the current page state to the server.
   */
  async function savePage(): Promise<boolean> {
    if (!currentPage || !pendingUpdate) return false

    isSaving.value = true
    lastError.value = null

    try {
      await $fetch(`/api/_openpress/pages/${currentPage.slug}`, {
        method: 'PUT',
        body: currentPage,
      })

      isDirty.value = false
      pendingUpdate = null

      // After save, the server writes the JSON file.
      // The Vite watcher detects this change and the HMR system
      // sends an 'openpress:content-change' event to the client,
      // which triggers useContentRefresh to invalidate the data cache.
      // This loop completes the Edit → Save → Preview cycle.

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      lastError.value = `Save failed: ${message}`
      console.warn('[OpenPress ContentSync] Save failed:', error)
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Handle incoming content updates from Tiptap bridge.
   */
  function handleContentUpdate(update: BlockContentUpdate) {
    if (!currentPage) return

    const updatedPage = applyUpdate(update)
    if (!updatedPage) return

    isDirty.value = true

    pendingUpdate = {
      pageSlug: currentPage.slug,
      blockId: update.blockId,
      sectionId: update.sectionId,
      slotName: update.slotName,
      content: update.content,
      html: update.html,
      timestamp: Date.now(),
    }

    // Debounce the save
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      savePage()
    }, debounceMs)
  }

  /**
   * Start listening for content updates.
   * Returns a cleanup function.
   */
  function start(): () => void {
    unregisterHandler = onContentUpdate(handleContentUpdate)
    return stop
  }

  /**
   * Stop listening and clean up timers.
   */
  function stop() {
    if (unregisterHandler) {
      unregisterHandler()
      unregisterHandler = null
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  /**
   * Force an immediate save (e.g. before navigation).
   */
  async function flush(): Promise<boolean> {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    if (pendingUpdate) {
      return savePage()
    }
    return true
  }

  return {
    isSaving,
    lastError,
    setPage,
    applyUpdate,
    savePage,
    start,
    stop,
    flush,
  }
}
