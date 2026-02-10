/**
 * HMR types for OpenPress JSON content hot-reloading.
 * Dev-only: These types define the WebSocket event payloads
 * sent from server to client when content files change.
 */

export type ContentType =
  | { type: 'page'; slug: string }
  | { type: 'site' }
  | { type: 'navigation' }

export interface ContentChangePayload {
  event: 'add' | 'change' | 'unlink'
  path: string
  contentType: ContentType
  timestamp: number
}
