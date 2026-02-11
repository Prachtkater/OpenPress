/**
 * Default app.config.ts für das Tailwind Plus Theme.
 *
 * Kann vom User in seiner eigenen app.config.ts überschrieben werden.
 * Pfad-Struktur: op.{component}.{slot} oder op.block.{blockType}.{slot}
 *
 * @example
 * // User-Override in app.config.ts:
 * export default defineAppConfig({
 *   op: {
 *     section: { inner: 'max-w-6xl' },
 *     block: {
 *       heading: { root: 'font-extrabold' },
 *     },
 *   },
 * })
 */
export const defaultAppConfig = {
  op: {
    // Section: keine zusätzlichen Overrides (Theme-Defaults reichen)
    section: {
      root: '',
      inner: '',
    },
    // Slot: keine zusätzlichen Overrides
    slot: {
      root: '',
      empty: '',
    },
    // Block Overrides
    block: {
      heading: {
        root: '',
      },
      paragraph: {
        root: '',
      },
      image: {
        root: '',
        img: '',
        caption: '',
      },
      button: {
        root: '',
      },
      video: {
        root: '',
        player: '',
        caption: '',
        overlay: '',
        playButton: '',
      },
      card: {
        root: '',
        header: '',
        body: '',
        footer: '',
        media: '',
      },
      input: {
        root: '',
        label: '',
        input: '',
        helper: '',
        error: '',
      },
    },
  },
} as const
