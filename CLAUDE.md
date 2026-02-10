# OpenPress - Claude Code Configuration

## Project

OpenPress is a Nuxt-native visual CMS with In-Context-Editing and Git-backed storage.
Monorepo managed with Bun Workspaces.

## Architecture Conventions

- **Runtime**: Bun (not Node.js)
- **Framework**: Nuxt 3
- **Schemas**: Zod for all data validation, TypeScript types derived from Zod
- **IDs**: ULID for all persistent entity IDs
- **Editor**: Tiptap for inline rich-text editing
- **Separation**: Features (logic) and Themes (visuals) are strictly separated

## Code Standards

- TypeScript strict mode everywhere
- Zod schemas as single source of truth for types
- No `any` types - use `unknown` + type narrowing
- Prefer `Bun.file()` / `Bun.write()` over Node.js `fs` API
- Git commits should be atomic and descriptive

## Package Naming

- Core packages: `@openpress/core`, `@openpress/ui`, `@openpress/schemas`
- Themes: `@openpress/theme-*`
- Features: `@openpress/feature-*`
- POCs: `@openpress/poc-*`

## CodeRabbit Review Notes

- Review in German (de-DE)
- POC packages: focus on feasibility, not polish
- Schema changes: verify Zod best practices
- Theme packages: enforce logic/visual separation
