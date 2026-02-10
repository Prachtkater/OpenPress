import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { createChangeDebouncer } from './debounce-changes'
import type { ContentChangePayload } from './types'

function makePayload(path: string, event: ContentChangePayload['event'] = 'change'): ContentChangePayload {
  return {
    event,
    path,
    contentType: { type: 'page', slug: path.replace('content/pages/', '').replace('.json', '') },
    timestamp: Date.now(),
  }
}

describe('createChangeDebouncer', () => {
  it('flushes a single change after the delay', async () => {
    const flushed: ContentChangePayload[][] = []
    const debouncer = createChangeDebouncer((changes) => {
      flushed.push(changes)
    }, 50)

    debouncer.add(makePayload('content/pages/about.json'))

    // Not yet flushed
    expect(flushed.length).toBe(0)

    // Wait for debounce
    await new Promise((r) => setTimeout(r, 80))

    expect(flushed.length).toBe(1)
    expect(flushed[0].length).toBe(1)
    expect(flushed[0][0].path).toBe('content/pages/about.json')

    debouncer.dispose()
  })

  it('batches multiple changes to different files', async () => {
    const flushed: ContentChangePayload[][] = []
    const debouncer = createChangeDebouncer((changes) => {
      flushed.push(changes)
    }, 50)

    debouncer.add(makePayload('content/pages/about.json'))
    debouncer.add(makePayload('content/pages/contact.json'))
    debouncer.add(makePayload('content/site.json'))

    await new Promise((r) => setTimeout(r, 80))

    expect(flushed.length).toBe(1)
    expect(flushed[0].length).toBe(3)

    debouncer.dispose()
  })

  it('overwrites earlier changes to the same path', async () => {
    const flushed: ContentChangePayload[][] = []
    const debouncer = createChangeDebouncer((changes) => {
      flushed.push(changes)
    }, 50)

    const first = makePayload('content/pages/about.json', 'add')
    const second = makePayload('content/pages/about.json', 'change')

    debouncer.add(first)
    debouncer.add(second)

    await new Promise((r) => setTimeout(r, 80))

    expect(flushed.length).toBe(1)
    expect(flushed[0].length).toBe(1)
    expect(flushed[0][0].event).toBe('change')

    debouncer.dispose()
  })

  it('resets the timer on each new change (debounce behavior)', async () => {
    const flushed: ContentChangePayload[][] = []
    const debouncer = createChangeDebouncer((changes) => {
      flushed.push(changes)
    }, 80)

    debouncer.add(makePayload('content/pages/a.json'))

    // After 50ms, add another change — this resets the 80ms timer
    await new Promise((r) => setTimeout(r, 50))
    debouncer.add(makePayload('content/pages/b.json'))

    // At 80ms from start: first timer would have fired, but it was reset
    await new Promise((r) => setTimeout(r, 50))
    expect(flushed.length).toBe(0)

    // Wait for the full debounce after the second add
    await new Promise((r) => setTimeout(r, 60))
    expect(flushed.length).toBe(1)
    expect(flushed[0].length).toBe(2)

    debouncer.dispose()
  })

  it('flush() triggers immediate emission', () => {
    const flushed: ContentChangePayload[][] = []
    const debouncer = createChangeDebouncer((changes) => {
      flushed.push(changes)
    }, 5000) // Very long delay

    debouncer.add(makePayload('content/pages/about.json'))
    debouncer.flush()

    expect(flushed.length).toBe(1)
    expect(flushed[0].length).toBe(1)

    debouncer.dispose()
  })

  it('flush() does nothing when no pending changes', () => {
    const flushed: ContentChangePayload[][] = []
    const debouncer = createChangeDebouncer((changes) => {
      flushed.push(changes)
    })

    debouncer.flush()
    expect(flushed.length).toBe(0)

    debouncer.dispose()
  })

  it('dispose() clears pending changes and timer', async () => {
    const flushed: ContentChangePayload[][] = []
    const debouncer = createChangeDebouncer((changes) => {
      flushed.push(changes)
    }, 50)

    debouncer.add(makePayload('content/pages/about.json'))
    debouncer.dispose()

    await new Promise((r) => setTimeout(r, 80))
    expect(flushed.length).toBe(0)
  })
})
