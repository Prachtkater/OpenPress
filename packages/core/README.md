# @openpress/core

Der zentrale Kern von OpenPress.

## Ziel

- Nuxt 3 Module (`/_edit` Route) als Einstiegspunkt
- **Section/Slot/Block Composition System** (`OpSection`, `OpSlot`, `OpBlock`)
- In-place Editing Engine mit Tiptap-Integration
- Git-backed JSON Storage Engine (Read/Write/Commit)
- Basic Content Blocks: Rich Text, Image, Video, Button, Link
- Layout & Navigation Editing
- Media Library & Basic SEO
- Composables: `useOpenPress`, `useEditor`, `useStorage`

## Architektur

```
src/
  module.ts              # Nuxt Module Einstiegspunkt
  runtime/
    components/          # OpSection, OpSlot, OpBlock, ...
    composables/         # useOpenPress, useEditor, useStorage
    server/              # API-Routes fuer Git-Interaktion
    pages/               # /_edit UI
```

## Status

Phase 0 - Planung & POCs
