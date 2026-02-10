# OpenPress Task Stack

## ALL TASKS: Definition of Done (DoD)
- [ ] Implement technical specification
- [ ] Write Unit/Integration Tests
- [ ] **Run Typecheck (`bun x tsc --noEmit`) and fix all errors**
- [ ] Verify build with Bun

## EPIC 1: Core Framework & Nuxt Module Logic
- [ ] Task 1.1: `src/module.ts` Hook-Struktur für `/_edit` Routing (Spezialist: Agent Core)
- [ ] Task 1.2: Server-Middleware für Git-Storage Bridge (Spezialist: Agent Core)
- [ ] Task 1.3: HMR-Integration für JSON-Inhalte (Spezialist: Agent Core)

## EPIC 2: UI Engine & Component Bridge (Op-System)
- [ ] Task 2.1: Implementierung des `OpProvider` (Global State & Config) (Spezialist: Agent UI)
- [ ] Task 2.2: `OpSection` & `OpSlot` Basis-Komponenten (Spezialist: Agent UI)
- [ ] Task 2.3: Tailwind-Klassen-Mapping System (Nuxt UI Style) (Spezialist: Agent UI)

## EPIC 3: Visual Editor (The Glow Frame)
- [ ] Task 3.1: In-Context Overlay Engine (Shadow DOM / Iframe Isolation?) (Spezialist: Agent Editor)
- [ ] Task 3.2: Tiptap Inline-Rich-Text Bridge (Spezialist: Agent Editor)
- [ ] Task 3.3: Component Picker UI (Floating Interface) (Spezialist: Agent Editor)

## EPIC 4: Theme Infrastructure
- [ ] Task 4.1: Tailwind Plus Theme Skeleton (Spezialist: Agent Themes)
- [ ] Task 4.2: Material Design 3 Expressive Skeleton (Spezialist: Agent Themes)

## EPIC 5: Feature Manifest System
- [ ] Task 5.1: Plugin-Discovery Logic für Nuxt Module (Spezialist: Agent Core)
