/**
 * Tailwind Plus — Design Tokens (TypeScript)
 *
 * Type-safe references to CSS custom properties defined in tokens.css.
 * Use these in components for programmatic access to theme values.
 */

// ─── Color Tokens ───────────────────────────────────────────────

export const tpColors = {
  primary: 'var(--op-color-primary)',
  primaryLight: 'var(--op-color-primary-light)',
  primaryDark: 'var(--op-color-primary-dark)',
  onPrimary: 'var(--op-color-on-primary)',

  secondary: 'var(--op-color-secondary)',
  secondaryLight: 'var(--op-color-secondary-light)',
  secondaryDark: 'var(--op-color-secondary-dark)',
  onSecondary: 'var(--op-color-on-secondary)',

  accent: 'var(--op-color-accent)',
  accentLight: 'var(--op-color-accent-light)',
  accentDark: 'var(--op-color-accent-dark)',
  onAccent: 'var(--op-color-on-accent)',

  surface: 'var(--op-color-surface)',
  surfaceMuted: 'var(--op-color-surface-muted)',
  surfaceInverse: 'var(--op-color-surface-inverse)',
  onSurface: 'var(--op-color-on-surface)',
  onSurfaceMuted: 'var(--op-color-on-surface-muted)',

  border: 'var(--op-color-border)',
  borderMuted: 'var(--op-color-border-muted)',

  success: 'var(--op-color-success)',
  successLight: 'var(--op-color-success-light)',
  onSuccess: 'var(--op-color-on-success)',

  warning: 'var(--op-color-warning)',
  warningLight: 'var(--op-color-warning-light)',
  onWarning: 'var(--op-color-on-warning)',

  error: 'var(--op-color-error)',
  errorLight: 'var(--op-color-error-light)',
  onError: 'var(--op-color-on-error)',
} as const

// ─── Breakpoint Tokens ──────────────────────────────────────────

export const tpBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ─── Spacing Tokens ─────────────────────────────────────────────

export const tpSpacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const

// ─── Typography Tokens ──────────────────────────────────────────

export const tpTypography = {
  displayLarge: 'text-5xl font-bold tracking-tight',
  displayMedium: 'text-4xl font-bold tracking-tight',
  displaySmall: 'text-3xl font-bold tracking-tight',
  headlineLarge: 'text-2xl font-semibold',
  headlineMedium: 'text-xl font-semibold',
  headlineSmall: 'text-lg font-semibold',
  bodyLarge: 'text-base leading-relaxed',
  bodyMedium: 'text-sm leading-relaxed',
  bodySmall: 'text-xs leading-relaxed',
  labelLarge: 'text-sm font-medium',
  labelMedium: 'text-xs font-medium',
  labelSmall: 'text-[11px] font-medium',
} as const

// ─── Elevation Tokens ───────────────────────────────────────────

export const tpElevation = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow',
  lg: 'shadow-md',
  xl: 'shadow-lg',
  '2xl': 'shadow-xl',
} as const

// ─── Border Radius Tokens ───────────────────────────────────────

export const tpRadius = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const

// ─── Transition Tokens ──────────────────────────────────────────

export const tpTransition = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

// ─── Type Exports ───────────────────────────────────────────────

export type TpColors = typeof tpColors
export type TpBreakpoints = typeof tpBreakpoints
export type TpSpacing = typeof tpSpacing
export type TpTypography = typeof tpTypography
export type TpElevation = typeof tpElevation
export type TpRadius = typeof tpRadius
export type TpTransition = typeof tpTransition
