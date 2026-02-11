# CodeRabbit Integration

## Uebersicht

OpenPress nutzt [CodeRabbit](https://coderabbit.ai) fuer automatische AI-Code-Reviews auf Pull Requests. Die Integration laeuft ueber die CodeRabbit GitHub App, die automatisch auf PR-Events reagiert.

## Architektur

```text
PR erstellt/aktualisiert
        |
        v
GitHub Webhook --> CodeRabbit App
        |
        v
.coderabbit.yaml gelesen
        |
        v
AI Review generiert
        |
        v
PR-Kommentare erstellt
```

## Konfiguration

### `.coderabbit.yaml`

Die zentrale Konfigurationsdatei im Repository-Root steuert das Review-Verhalten:

| Setting | Wert | Beschreibung |
|---------|------|-------------|
| `language` | `de-DE` | Reviews auf Deutsch |
| `reviews.profile` | `chill` | Pragmatischer Review-Stil |
| `reviews.auto_review.enabled` | `true` | Automatische Reviews aktiv |
| `reviews.auto_review.drafts` | `false` | Draft-PRs werden uebersprungen |
| `reviews.high_level_summary` | `true` | Zusammenfassung im Walkthrough |
| `reviews.sequence_diagrams` | `true` | Sequenzdiagramme bei Bedarf |
| `reviews.poem` | `false` | Keine Review-Gedichte |

### Pfad-spezifische Anweisungen

CodeRabbit erhaelt kontextspezifische Anweisungen je nach Paket:

- **`packages/core/**`** - Nuxt-Konventionen, TypeScript-Strenge, Module-Hooks
- **`packages/schemas/**`** - Zod Best Practices, `z.output<>`, Type-Safety
- **`packages/poc-*/**`** - Machbarkeit vor Code-Qualitaet
- **`packages/theme-*/**`** - Strikte Logik/Visual-Trennung
- **`packages/feature-*/**`** - Feature-Manifest Konventionen
- **`packages/ui/**`** - Glow-Frame Konventionen, Theme-Engine
- **`playground/**`** - Keine produktionsrelevanten Standards

### Ignorierte Pfade

Diese Dateien werden nicht reviewt:
- `**/*.lock`, `**/bun.lockb` - Lock-Dateien
- `**/dist/**`, `**/.nuxt/**`, `**/.output/**` - Build-Artefakte
- `**/node_modules/**` - Abhaengigkeiten

## GitHub App Setup

### Voraussetzung

CodeRabbit GitHub App muss auf dem Repository installiert sein:
1. https://github.com/apps/coderabbitai aufrufen
2. Fuer `Prachtkater/OpenPress` installieren
3. Berechtigungen: Pull Requests (read/write), Contents (read)

### Automatische Reviews

CodeRabbit reviewt automatisch jede PR gegen `main`. Kein GitHub Action noetig - die App wird ueber Webhooks getriggert.

## CI Integration

### Workflow (`ci.yml`)

Der CI Workflow laeuft parallel zu CodeRabbit:

```text
PR erstellt
  |
  +-- CI: Typecheck (bun x tsc --noEmit)
  +-- CI: Tests (bun test)
  +-- CI: Validate CodeRabbit Config (.coderabbit.yaml)
  +-- CodeRabbit: AI Review (via GitHub App)
```

Jobs:
- **Typecheck** - TypeScript-Pruefung mit `bun x tsc --noEmit`
- **Tests** - Testsuite mit `bun test` (Git-Config fuer Storage-Tests)
- **Validate Config** - Stellt sicher, dass `.coderabbit.yaml` valides YAML ist (nur auf PRs)

CodeRabbit sieht den CI-Status und kann darauf in Reviews verweisen.

## CodeRabbit CLI (Lokal)

### Installation

```bash
# Linux / macOS
curl -fsSL https://cli.coderabbit.ai/install.sh | sh

# Falls unzip fehlt (z.B. minimale Container)
VERSION=$(curl -fsSL https://cli.coderabbit.ai/releases/latest/VERSION)
curl -fsSL -o /tmp/coderabbit.zip \
  "https://cli.coderabbit.ai/releases/${VERSION}/coderabbit-linux-x64.zip"
python3 -c "import zipfile; zipfile.ZipFile('/tmp/coderabbit.zip').extractall('/tmp')"
chmod +x /tmp/coderabbit && mv /tmp/coderabbit ~/.local/bin/

# macOS (Homebrew)
brew install coderabbit

# Verify
coderabbit --version
```

### Authentifizierung

```bash
coderabbit auth login   # OAuth im Browser
coderabbit auth status  # Status pruefen
```

### Review-Befehle

```bash
# Alle Aenderungen reviewen
coderabbit review

# Nur committete Aenderungen
coderabbit review --type committed

# Nur uncommittete Aenderungen
coderabbit review --type uncommitted

# Vergleich mit main Branch
coderabbit review --base main

# Plain-Text Output (fuer CI/Scripting)
coderabbit review --plain

# AI Agent Modus (minimal, fuer LLM)
coderabbit review --prompt-only

# Mit Projekt-Config als Kontext
coderabbit review --config CLAUDE.md .coderabbit.yaml
```

## Interaktion mit CodeRabbit

### PR-Kommentare

CodeRabbit erstellt automatisch:
- **Walkthrough**: Zusammenfassung aller Aenderungen
- **Datei-Reviews**: Inline-Kommentare mit Verbesserungsvorschlaegen
- **Sequenzdiagramme**: Bei komplexen Aenderungsflows

### Befehle in PR-Kommentaren

In einem PR-Kommentar an `@coderabbitai`:

| Befehl | Beschreibung |
|--------|-------------|
| `@coderabbitai review` | Manuell Review anfordern |
| `@coderabbitai summary` | Zusammenfassung aktualisieren |
| `@coderabbitai resolve` | Alle Kommentare als resolved markieren |
| `@coderabbitai generate docstrings` | Docstrings generieren |
| `@coderabbitai generate unit tests` | Unit Tests generieren |
| `@coderabbitai configuration` | Aktuelle Config anzeigen |
| `@coderabbitai help` | Hilfe anzeigen |

Auf Review-Kommentare kann direkt geantwortet werden - CodeRabbit reagiert auf Rueckfragen.

### Ignore-Keywords im PR-Titel

PRs mit diesen Keywords im Titel werden nicht reviewt:
- `WIP`
- `DO NOT MERGE`

## Analyse-Tools

CodeRabbit nutzt diese Tools bei Reviews:
- **ESLint, Biome** - Code-Linting
- **markdownlint, yamllint** - Markup-Validierung
- **ShellCheck** - Shell-Script-Analyse
- **Gitleaks** - Secret Detection
- **Semgrep** - Security Patterns
- **actionlint** - GitHub Actions Validierung

## PR-Workflow

1. Branch erstellen: `git checkout -b feat/mein-feature`
2. Aenderungen committen (atomic commits)
3. Optional: Lokal reviewen mit `coderabbit review --base main`
4. PR oeffnen: `gh pr create --title "feat: ..." --body "..."`
5. CodeRabbit reviewt automatisch
6. CI laeuft (Typecheck + Tests + Config-Validierung)
7. Review-Kommentare bearbeiten
8. PR mergen nach Approval

## Troubleshooting

### CodeRabbit reviewt nicht

1. Pruefen ob die GitHub App installiert ist (Repo Settings > Integrations)
2. Pruefen ob der PR-Titel kein Ignore-Keyword enthaelt (`WIP`, `DO NOT MERGE`)
3. Pruefen ob der PR kein Draft ist (`reviews.auto_review.drafts: false`)
4. `.coderabbit.yaml` Syntax validieren:
   ```bash
   python3 -c "import yaml; yaml.safe_load(open('.coderabbit.yaml'))"
   ```

### Review ist zu streng/locker

`reviews.profile` in `.coderabbit.yaml` anpassen:
- `chill` - Pragmatisch, nur wichtige Issues (aktuell)
- `assertive` - Strenger, mehr Vorschlaege
- `default` - Ausgewogen
