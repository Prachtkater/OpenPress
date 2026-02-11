/**
 * Tailwind Plus — Design Tokens
 *
 * CSS custom property-based color system with light/dark mode support.
 * Semantic color roles follow the Tailwind Plus design language:
 * - Primary, Secondary, Accent (brand palette)
 * - Neutral (grays for text, borders, backgrounds)
 * - Success, Warning, Error (feedback)
 *
 * Each role provides: base, light, dark, contrast variants.
 * These map to CSS custom properties defined in tokens.css.
 */

// ─── Color Tokens (Semantic Roles) ───────────────────────────

export const tpColors = {
  // Primary
  primary: 'var(--op-color-primary)',
  primaryLight: 'var(--op-color-primary-light)',
  primaryDark: 'var(--op-color-primary-dark)',
  onPrimary: 'var(--op-color-on-primary)',

  // Secondary
  secondary: 'var(--op-color-secondary)',
  secondaryLight: 'var(--op-color-secondary-light)',
  secondaryDark: 'var(--op-color-secondary-dark)',
  onSecondary: 'var(--op-color-on-secondary)',

  // Accent
  accent: 'var(--op-color-accent)',
  accentLight: 'var(--op-color-accent-light)',
  accentDark: 'var(--op-color-accent-dark)',
  onAccent: 'var(--op-color-on-accent)',

  // Neutral / Surface
  surface: 'var(--op-color-surface)',
  surfaceMuted: 'var(--op-color-surface-muted)',
  surfaceInverse: 'var(--op-color-surface-inverse)',
  onSurface: 'var(--op-color-on-surface)',
  onSurfaceMuted: 'var(--op-color-on-surface-muted)',

  // Border
  border: 'var(--op-color-border)',
  borderMuted: 'var(--op-color-border-muted)',

  // Feedback: Success
  success: 'var(--op-color-success)',
  successLight: 'var(--op-color-success-light)',
  onSuccess: 'var(--op-color-on-success)',

  // Feedback: Warning
  warning: 'var(--op-color-warning)',
  warningLight: 'var(--op-color-warning-light)',
  onWarning: 'var(--op-color-on-warning)',

  // Feedback: Error
  error: 'var(--op-color-error)',
  errorLight: 'var(--op-color-error-light)',
  onError: 'var(--op-color-on-error)',
} as const

// ─── Responsive Breakpoints ──────────────────────────────────
// Matches Tailwind defaults. Exported for programmatic use.

export const tpBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ─── Spacing Scale ───────────────────────────────────────────
// Section-level spacing tokens for consistent vertical rhythm.

export const tpSpacing = {
  sectionY: 'py-16 sm:py-20 lg:py-24',
  sectionYCompact: 'py-8 sm:py-12 lg:py-16',
  sectionYLarge: 'py-24 sm:py-32 lg:py-40',
  sectionX: 'px-6 lg:px-8',
  containerMax: 'mx-auto max-w-7xl',
  containerNarrow: 'mx-auto max-w-3xl',
  containerWide: 'mx-auto max-w-screen-2xl',
} as const

// ─── Typography Tokens ───────────────────────────────────────
// Tailwind Plus responsive type scale.

export const tpTypography = {
  displayLarge: 'text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight',
  displayMedium: 'text-3xl sm:text-4xl font-bold tracking-tight',
  displaySmall: 'text-2xl sm:text-3xl font-bold tracking-tight',
  headingLarge: 'text-xl sm:text-2xl font-semibold',
  headingMedium: 'text-lg sm:text-xl font-semibold',
  headingSmall: 'text-base sm:text-lg font-semibold',
  bodyLarge: 'text-lg leading-8',
  bodyBase: 'text-base leading-7',
  bodySmall: 'text-sm leading-6',
  caption: 'text-xs leading-5',
  label: 'text-sm font-medium',
} as const

// ─── Shadow / Elevation ──────────────────────────────────────

export const tpElevation = {
  none: '',
  sm: 'shadow-sm',
  base: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
} as const

// ─── Border Radius Scale ─────────────────────────────────────

export const tpRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  base: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const

// ─── Transition Tokens ───────────────────────────────────────

export const tpTransition = {
  fast: 'transition-all duration-150 ease-in-out',
  base: 'transition-all duration-200 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
  colors: 'transition-colors duration-200 ease-in-out',
  transform: 'transition-transform duration-200 ease-in-out',
} as const

export type TpColors = typeof tpColors
export type TpBreakpoints = typeof tpBreakpoints
export type TpSpacing = typeof tpSpacing
export type TpTypography = typeof tpTypography
export type TpElevation = typeof tpElevation
export type TpRadius = typeof tpRadius
export type TpTransition = typeof tpTransition
