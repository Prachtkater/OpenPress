# Projekt: M3-Atomic (Arbeitstitel)

## Vision
Ein Nuxt-natives UI-System für Material Design 3 (M3), das die DX von Nuxt UI mit der Power von UnoCSS kombiniert.

## Kernpunkte
- **Atomic CSS First**: Volle Integration in UnoCSS. Generierung aller M3 Design Tokens als Utility Classes.
- **Nuxt UI DX**: Das gleiche reaktive `app.config.ts` Pattern für Komponenten-Klassen und Overrides.
- **Strict M3**: 1:1 Umsetzung der Tokens, Komponenten und UX-Philosophie von m3.material.io.
- **Modular**: Kann als eigenständiges Projekt existieren und dient als Basis für das `@openpress/theme-material-expressive`.

## Strategie
1. Erstellung einer UnoCSS-Preset für M3 Tokens (Colors, Typography, Elevation, Shapes).
2. Entwicklung von Base-Komponenten (Buttons, Cards, Inputs) mit dem Nuxt UI Klassen-Mapping Pattern.
3. Integration in OpenPress als Premium-Theme-Option.
