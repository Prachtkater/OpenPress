import type { Page, SiteConfig, Navigation, Section } from '@openpress/schemas'
import type { OpThemeConfig } from '../types'

/**
 * Typisierte Context-Keys für das OpenPress provide/inject System.
 * Jeder Key ist ein einzigartiges Symbol mit beschreibendem Namen.
 */

export const OP_PAGE_KEY = Symbol('op-page') as symbol & { __type: Page }
export const OP_SITE_KEY = Symbol('op-site') as symbol & { __type: Readonly<SiteConfig> }
export const OP_NAV_KEY = Symbol('op-nav') as symbol & { __type: Readonly<Navigation> }
export const OP_MODE_KEY = Symbol('op-mode') as symbol & { __type: 'view' | 'edit' }
export const OP_THEME_KEY = Symbol('op-theme') as symbol & { __type: Readonly<OpThemeConfig> }
export const OP_LOCALE_KEY = Symbol('op-locale') as symbol & { __type: string }
export const OP_SECTION_KEY = Symbol('op-section') as symbol & { __type: Section }

export interface OpSlotContext {
  name: string
  sectionId: string
}

export const OP_SLOT_KEY = Symbol('op-slot') as symbol & { __type: OpSlotContext }
