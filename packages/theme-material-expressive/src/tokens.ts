/**
 * Material Design 3 Expressive — Design Tokens
 *
 * Based on the M3 Design System (m3.material.io).
 * Uses CSS custom properties mapped to Tailwind utility classes.
 *
 * Color roles follow the M3 color system:
 * - Primary, Secondary, Tertiary (tonal palettes)
 * - Surface, On-Surface, Outline
 * - Error, On-Error
 *
 * Typography follows M3 type scale:
 * - Display, Headline, Title, Body, Label
 *
 * Elevation follows M3 elevation levels (0-5).
 */

// ─── Color Tokens (M3 Baseline) ────────────────────────────────
// These map to CSS custom properties defined in tokens.css.
// Tailwind classes reference these via arbitrary values or the
// extended theme config in the consuming app.

export const m3Colors = {
  // Primary
  primary: 'var(--md-sys-color-primary)',
  onPrimary: 'var(--md-sys-color-on-primary)',
  primaryContainer: 'var(--md-sys-color-primary-container)',
  onPrimaryContainer: 'var(--md-sys-color-on-primary-container)',

  // Secondary
  secondary: 'var(--md-sys-color-secondary)',
  onSecondary: 'var(--md-sys-color-on-secondary)',
  secondaryContainer: 'var(--md-sys-color-secondary-container)',
  onSecondaryContainer: 'var(--md-sys-color-on-secondary-container)',

  // Tertiary
  tertiary: 'var(--md-sys-color-tertiary)',
  onTertiary: 'var(--md-sys-color-on-tertiary)',
  tertiaryContainer: 'var(--md-sys-color-tertiary-container)',
  onTertiaryContainer: 'var(--md-sys-color-on-tertiary-container)',

  // Error
  error: 'var(--md-sys-color-error)',
  onError: 'var(--md-sys-color-on-error)',
  errorContainer: 'var(--md-sys-color-error-container)',
  onErrorContainer: 'var(--md-sys-color-on-error-container)',

  // Surface
  surface: 'var(--md-sys-color-surface)',
  onSurface: 'var(--md-sys-color-on-surface)',
  surfaceVariant: 'var(--md-sys-color-surface-variant)',
  onSurfaceVariant: 'var(--md-sys-color-on-surface-variant)',
  surfaceContainerLowest: 'var(--md-sys-color-surface-container-lowest)',
  surfaceContainerLow: 'var(--md-sys-color-surface-container-low)',
  surfaceContainer: 'var(--md-sys-color-surface-container)',
  surfaceContainerHigh: 'var(--md-sys-color-surface-container-high)',
  surfaceContainerHighest: 'var(--md-sys-color-surface-container-highest)',

  // Outline
  outline: 'var(--md-sys-color-outline)',
  outlineVariant: 'var(--md-sys-color-outline-variant)',

  // Inverse
  inverseSurface: 'var(--md-sys-color-inverse-surface)',
  inverseOnSurface: 'var(--md-sys-color-inverse-on-surface)',
  inversePrimary: 'var(--md-sys-color-inverse-primary)',

  // Misc
  shadow: 'var(--md-sys-color-shadow)',
  scrim: 'var(--md-sys-color-scrim)',
} as const

// ─── Typography Tokens (M3 Type Scale) ─────────────────────────
// M3 defines 5 roles × 3 sizes = 15 styles.
// Mapped to Tailwind classes for direct use in theme definitions.

export const m3Typography = {
  displayLarge: 'text-[57px] leading-[64px] tracking-[-0.25px] font-normal',
  displayMedium: 'text-[45px] leading-[52px] tracking-normal font-normal',
  displaySmall: 'text-[36px] leading-[44px] tracking-normal font-normal',

  headlineLarge: 'text-[32px] leading-[40px] tracking-normal font-normal',
  headlineMedium: 'text-[28px] leading-[36px] tracking-normal font-normal',
  headlineSmall: 'text-[24px] leading-[32px] tracking-normal font-normal',

  titleLarge: 'text-[22px] leading-[28px] tracking-normal font-normal',
  titleMedium: 'text-[16px] leading-[24px] tracking-[0.15px] font-medium',
  titleSmall: 'text-[14px] leading-[20px] tracking-[0.1px] font-medium',

  bodyLarge: 'text-[16px] leading-[24px] tracking-[0.5px] font-normal',
  bodyMedium: 'text-[14px] leading-[20px] tracking-[0.25px] font-normal',
  bodySmall: 'text-[12px] leading-[16px] tracking-[0.4px] font-normal',

  labelLarge: 'text-[14px] leading-[20px] tracking-[0.1px] font-medium',
  labelMedium: 'text-[12px] leading-[16px] tracking-[0.5px] font-medium',
  labelSmall: 'text-[11px] leading-[16px] tracking-[0.5px] font-medium',
} as const

// ─── Elevation Tokens (M3 Elevation Levels) ────────────────────
// M3 uses 6 levels (0-5). Each maps to a box-shadow + surface tint.
// In Tailwind, we combine shadow utilities with surface tint overlays.

export const m3Elevation = {
  level0: '',
  level1: 'shadow-sm',
  level2: 'shadow',
  level3: 'shadow-md',
  level4: 'shadow-lg',
  level5: 'shadow-xl',
} as const

// ─── Shape Tokens (M3 Shape Scale) ─────────────────────────────
// M3 Expressive uses more pronounced rounding.

export const m3Shape = {
  none: 'rounded-none',
  extraSmall: 'rounded',
  small: 'rounded-lg',
  medium: 'rounded-xl',
  large: 'rounded-2xl',
  extraLarge: 'rounded-3xl',
  full: 'rounded-full',
} as const

// ─── Motion Tokens (M3 Easing + Duration) ──────────────────────
// M3 "Expressive" uses emphasized easing curves and longer durations.

export const m3Motion = {
  durationShort1: '50ms',
  durationShort2: '100ms',
  durationShort3: '150ms',
  durationShort4: '200ms',
  durationMedium1: '250ms',
  durationMedium2: '300ms',
  durationMedium3: '350ms',
  durationMedium4: '400ms',
  durationLong1: '450ms',
  durationLong2: '500ms',
  durationLong3: '550ms',
  durationLong4: '600ms',
  durationExtraLong1: '700ms',
  durationExtraLong2: '800ms',
  durationExtraLong3: '900ms',
  durationExtraLong4: '1000ms',

  easingStandard: 'cubic-bezier(0.2, 0, 0, 1)',
  easingStandardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
  easingStandardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
  easingEmphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  easingEmphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  easingEmphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
} as const

// ─── State Layer Opacity (M3) ──────────────────────────────────

export const m3StateLayer = {
  hover: '0.08',
  focus: '0.10',
  pressed: '0.10',
  dragged: '0.16',
} as const

export type M3Typography = typeof m3Typography
export type M3Elevation = typeof m3Elevation
export type M3Shape = typeof m3Shape
export type M3Motion = typeof m3Motion
