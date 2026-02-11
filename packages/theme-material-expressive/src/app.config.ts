/**
 * Material Design 3 Expressive — app.config.ts
 *
 * Default configuration for the M3 Expressive theme.
 * Users can override these values in their own app.config.ts
 * under the `op` key to customize the theme without modifying
 * the theme package itself.
 *
 * Override hierarchy (ascending priority):
 * 1. Theme defaults (this file)
 * 2. User's app.config.ts overrides
 * 3. Component-level `ui` prop overrides
 */
export default {
  op: {
    section: {
      root: 'font-[var(--md-sys-typescale-font)]',
    },
    slot: {},
    block: {
      heading: {},
      paragraph: {},
      image: {},
      button: {},
      video: {},
    },
  },
}
