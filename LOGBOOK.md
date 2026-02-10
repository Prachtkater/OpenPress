# Projekt-Logbuch: OpenPress (Nuxt Visual CMS)

## 2026-02-10
- **Status:** Initialisierung (Masterplan-Phase)
- **Projektname:** **OpenPress** (Helper: `Op...`, Config: `openpress.config.json`)
- **Fokus:** Masterplan-Erstellung durch Claude Code
- **Entscheidungen:**
  - Runtime: Bun
  - Datenformat: JSON (Git-backed)
  - Ziel: Full Typesafety
- Integration: Nuxt Module (läuft unter `/_edit`)
- UI-Konzept: Full-page für globale Übersicht, minimaler Editor-Frame.
- Modul-Strategie: Schlanker Core + Opt-in Module (@openpress/*).
- Themes: Tailwind Plus, Material Design 3 Expressive.
- Features: Kontakt-Formular (NodeMailer), Termin-Buchung.
- Design-Philosophie (M3): Striktes Befolgen der Tokens, Komponenten und UX-Prinzipien von m3.material.io.
- Vision M3-Atomic: Separates UI-System Projekt. UnoCSS-basiertes Atomic CSS mit M3 Tokens. DX wie Nuxt UI. Basis für unser Material Theme.
- Review-Stack: CodeRabbit (Testversion, integriert mit Claude Code).
- Referenz-Repositories (Inspiration):
  - davidmarkl/nuxt-monorepo (Prose Components, Tailwind Plus Inspiration)
  - prismicio/prismic-client (API & Client Pattern)
  - nuxt/ui (Component Classes Overwrite, App Config, Color System)
  - nuxt-content/nuxt-studio (Collaboration, Auth, UI-Integration)
  - prismicio/slice-machine (Slice/Component Definition Workflow)

### Agenten-Orchestrierung & Aufgaben-Stack
- **Strategie:** Parallelisierung via Claude Code Sessions.
- **Orchestrator:** Giovanni (Ich) verwaltet den Task-Stack und delegiert an spezialisierte Claude-Sitzungen.
- **Task-Zerlegung:** Große Aufgaben -> Claude (Planer) -> Sub-Tasks -> Claude (Worker).

### Aktivitäten:
- 2026-02-10: POC 1 (Storage Engine) erfolgreich abgeschlossen.
- 2026-02-10: Neue Referenz-Repos in die Analyse-Pipeline für Phase 1 (Core & UI) aufgenommen.
