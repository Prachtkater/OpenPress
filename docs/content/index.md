---
title: OpenPress
description: Nuxt-natives, visuelles CMS mit In-Context-Editing und Git-basiertem Storage.
navigation: false
layout: default
---

# OpenPress

Nuxt-natives, visuelles CMS mit In-Context-Editing und Git-basiertem Storage.

## Monorepo-Struktur

| Paket | Beschreibung |
|---|---|
| `packages/core` | Nuxt Module, Composition System, Editor Engine |
| `packages/ui` | Glow-Frame Editor UI Components |
| `packages/schemas` | Zod Schema-Definitionen |
| `packages/poc-storage` | POC 1: Git-backed JSON Storage Engine |
| `packages/poc-editor` | POC 2: Glow-Frame Overlay UI Prototyp |
| `packages/theme-tailwind-plus` | Theme: Tailwind CSS Design System |
| `packages/theme-material-expressive` | Theme: Material Design 3 Expressive |
| `packages/feature-contact-form` | Feature: Kontaktformular |
| `packages/feature-booking` | Feature: Buchungssystem |
| `playground` | Entwicklungs- und Test-Umgebung |

## Technologie

- **Runtime**: Bun
- **Framework**: Nuxt 3
- **Typesafety**: Zod + TypeScript
- **Editor**: Tiptap
- **IDs**: ULID

## Schnellstart

```bash
bun install
bun run dev
```
