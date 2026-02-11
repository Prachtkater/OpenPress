// Types
export type { OpThemeConfig, OpComponentTheme, OpCompoundVariant, ResolvedClasses } from './types'
export type { OpSlotContext } from './runtime/keys'

// Keys
export {
  OP_PAGE_KEY,
  OP_SITE_KEY,
  OP_NAV_KEY,
  OP_MODE_KEY,
  OP_THEME_KEY,
  OP_LOCALE_KEY,
  OP_SECTION_KEY,
  OP_SLOT_KEY,
} from './runtime/keys'

// Context (provide/inject)
export { provide, inject, revoke, clearContext } from './runtime/context'

// Theme Resolution
export { registerTheme, resolveTheme, loadTheme, clearThemeRegistry } from './runtime/theme/resolve'
export { resolveComponentClasses } from './runtime/theme/resolve-classes'

// Theme Defaults
export { defaultTheme, sectionTheme, slotTheme } from './runtime/theme/defaults'

// Block Resolution
export {
  registerBlock,
  resolveBlockComponent,
  hasBlock,
  getRegisteredBlockTypes,
  clearBlockRegistry,
  OpBlockFallback,
  type BlockComponentDef,
} from './runtime/blocks/resolve'

// Composables
export { useOpProvider, type UseOpProviderReturn } from './runtime/composables/useOpProvider'
export { useOpenPress, type UseOpenPressReturn } from './runtime/composables/useOpenPress'
export { useOpMode, type UseOpModeReturn } from './runtime/composables/useOpMode'
export { useOpSection, type UseOpSectionReturn } from './runtime/composables/useOpSection'
export { useOpSlot, type UseOpSlotReturn } from './runtime/composables/useOpSlot'
export { useOpThemeClasses, useOpBlockClasses } from './runtime/composables/useOpThemeClasses'

// Component Setup Functions
export { setupOpProvider, type OpProviderProps, type OpProviderState } from './runtime/components/OpProvider'
export { setupOpSection, type OpSectionProps, type OpSectionState, type OpSectionUI } from './runtime/components/OpSection'
export { setupOpSlot, type OpSlotProps, type OpSlotState, type OpSlotUI } from './runtime/components/OpSlot'
