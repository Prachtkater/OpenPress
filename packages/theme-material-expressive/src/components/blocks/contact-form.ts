import type { OpComponentTheme } from '@openpress/ui'
import { m3Typography, m3Shape } from '../../tokens'

/**
 * M3 Expressive — Contact Form Block
 *
 * Follows M3 text field specs (outlined variant).
 * Uses M3 shape, color, and typography tokens.
 */
export const contactForm: OpComponentTheme = {
  slots: {
    root: 'w-full',
    form: 'flex flex-col gap-6',
    fieldGroup: 'flex flex-col gap-1',
    label: [
      m3Typography.bodySmall,
      'text-[var(--md-sys-color-on-surface-variant)]',
    ].join(' '),
    required: 'text-[var(--md-sys-color-error)] ml-0.5',
    input: [
      'w-full px-4 py-3',
      m3Shape.extraSmall,
      m3Typography.bodyLarge,
      'border border-[var(--md-sys-color-outline)]',
      'bg-transparent',
      'text-[var(--md-sys-color-on-surface)]',
      'placeholder:text-[var(--md-sys-color-on-surface-variant)]',
      'focus:border-[var(--md-sys-color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]/20',
      'transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
    ].join(' '),
    inputError: 'border-[var(--md-sys-color-error)] focus:border-[var(--md-sys-color-error)] focus:ring-[var(--md-sys-color-error)]/20',
    textarea: 'resize-y min-h-[120px]',
    select: 'appearance-none',
    checkboxWrapper: 'flex items-center gap-3',
    checkbox: [
      'h-[18px] w-[18px]',
      m3Shape.extraSmall,
      'border-2 border-[var(--md-sys-color-on-surface-variant)]',
      'text-[var(--md-sys-color-primary)]',
      'focus:ring-[var(--md-sys-color-primary)]',
    ].join(' '),
    checkboxLabel: [
      m3Typography.bodyMedium,
      'text-[var(--md-sys-color-on-surface)]',
    ].join(' '),
    error: [
      m3Typography.bodySmall,
      'text-[var(--md-sys-color-error)]',
    ].join(' '),
    submitError: [
      m3Typography.bodyMedium,
      'text-[var(--md-sys-color-error)]',
    ].join(' '),
    button: [
      'inline-flex items-center justify-center gap-2',
      'px-6 h-10',
      m3Shape.full,
      m3Typography.labelLarge,
      'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]',
      'transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
      'hover:shadow-sm',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] focus-visible:ring-offset-2',
      'disabled:opacity-[0.38] disabled:pointer-events-none',
    ].join(' '),
    spinner: 'h-4 w-4 animate-spin rounded-full border-2 border-[var(--md-sys-color-on-primary)] border-t-transparent',
    success: [
      m3Shape.medium,
      'border border-[var(--md-sys-color-outline-variant)]',
      'bg-[var(--md-sys-color-surface-container)]',
      'p-6 text-center',
      'text-[var(--md-sys-color-on-surface)]',
    ].join(' '),
  },
}
