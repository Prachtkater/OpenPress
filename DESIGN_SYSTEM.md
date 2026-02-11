# DESIGN_SYSTEM.md - Apple Liquid Glass with Tailwind Cyan

## Principles
- **Clarity & Depth**: Use backdrop blur and shadows to create a layered experience.
- **Vibrant Accents**: Use Tailwind Cyan (`cyan-400` / `cyan-500`) for primary actions and highlights.
- **Precision**: 1px borders with subtle gradients to simulate light refraction on glass edges.

## Visual Tokens
- **Backgrounds**: `bg-white/70` or `bg-slate-900/70` with `backdrop-blur-md`.
- **Borders**: `border border-white/20` (light) or `border border-slate-700/50` (dark).
- **Shadows**: `shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]`.
- **Text**: Tailwind Cyan for active states, deep slate for readability.

## Components
- **Glow Frame**: A `cyan-400` neon glow (`drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]`) around the active section.
- **Plus Lines**: Cyan-500 lines that appear between sections with a slight bounce animation.
- **Buttons**: Glassmorphic base with a high-shine top gradient.
