import type { ContentChangePayload } from './types'

/**
 * Creates a debounced change collector that batches rapid file changes.
 * When multiple changes occur within the delay window, they are collected
 * and flushed together. Later changes to the same path overwrite earlier ones.
 *
 * @param onFlush - Callback invoked with all collected changes after the debounce window
 * @param delay - Debounce delay in milliseconds (default: 100ms)
 */
export function createChangeDebouncer(
  onFlush: (changes: ContentChangePayload[]) => void,
  delay = 100,
) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const pending = new Map<string, ContentChangePayload>()

  function add(payload: ContentChangePayload): void {
    // Later change to the same path overwrites earlier one
    pending.set(payload.path, payload)

    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, delay)
  }

  function flush(): void {
    timer = null
    if (pending.size === 0) return

    const changes = Array.from(pending.values())
    pending.clear()
    onFlush(changes)
  }

  function dispose(): void {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    pending.clear()
  }

  return { add, flush, dispose }
}
