# CodeRabbit Setup

## Overview

This repository uses [CodeRabbit](https://coderabbit.ai) for AI-powered code reviews on pull requests. CodeRabbit is configured both as a GitHub App (automatic PR reviews) and via the CLI for local pre-commit reviews.

## GitHub Integration

CodeRabbit reviews PRs automatically when they are opened or updated. Configuration lives in `.coderabbit.yaml` at the repo root.

### Configuration (`.coderabbit.yaml`)

- **Language**: German (de-DE)
- **Profile**: chill — less strict, focuses on real issues
- **Auto-review**: Enabled for non-draft PRs
- **High-level summary**: Enabled
- **Request changes workflow**: Enabled
- **Path-specific instructions**: Custom review focus per package (see file for details)

## CLI Installation

The CodeRabbit CLI (`coderabbit` / `cr`) enables local code reviews before pushing.

### Install (Linux / macOS)

```bash
curl -fsSL https://cli.coderabbit.ai/install.sh | sh
```

If `unzip` is unavailable (e.g. minimal containers), install manually:

```bash
# Get latest version
VERSION=$(curl -fsSL https://cli.coderabbit.ai/releases/latest/VERSION)

# Download and extract with Python
curl -fsSL -o /tmp/coderabbit.zip \
  "https://cli.coderabbit.ai/releases/${VERSION}/coderabbit-linux-x64.zip"
python3 -c "import zipfile; zipfile.ZipFile('/tmp/coderabbit.zip').extractall('/tmp')"

# Install
chmod +x /tmp/coderabbit
mkdir -p ~/.local/bin
mv /tmp/coderabbit ~/.local/bin/coderabbit
ln -sf ~/.local/bin/coderabbit ~/.local/bin/cr
```

### macOS (Homebrew)

```bash
brew install coderabbit
```

### Verify

```bash
coderabbit --version
# or
cr --version
```

## Authentication

Link your CodeRabbit account for personalized, context-aware reviews:

```bash
coderabbit auth login
```

This opens a browser for OAuth. Paste the token back into the terminal.

Check status:

```bash
coderabbit auth status
```

## CLI Usage

### Review all changes (staged + unstaged + committed)

```bash
cr review
```

### Review only uncommitted changes

```bash
cr review --type uncommitted
```

### Review committed changes against a branch

```bash
cr review --base main
```

### Plain text output (for CI or piping)

```bash
cr review --plain
```

### AI agent mode (minimal output for LLM consumption)

```bash
cr review --prompt-only
```

### Use project config files as additional context

```bash
cr review --config CLAUDE.md .coderabbit.yaml
```

## Project-Specific Review Rules

Path-specific instructions are defined in `.coderabbit.yaml` under `reviews.path_instructions`. Current rules:

| Path Pattern | Focus |
|---|---|
| `packages/core/**` | Nuxt conventions, TypeScript strictness |
| `packages/poc-*/**` | Feasibility over polish |
| `packages/schemas/**` | Zod best practices, type safety |
| `packages/theme-*/**` | Logic/visual separation |
| `packages/feature-*/**` | Feature manifest conventions |
| `packages/ui/**` | Glow-Frame conventions, theme engine compatibility |
| `playground/**` | Demo/test environment only |

## Interaktion mit Reviews

### Auf PR-Comments antworten
CodeRabbit reagiert auf Antworten in PR-Kommentaren. Einfach auf einen Review-Kommentar antworten, um Rückfragen zu stellen oder Kontext zu liefern.

### Spezielle Kommentare
```
@coderabbitai review     — Review erneut triggern
@coderabbitai resolve    — Alle Kommentare als gelöst markieren
@coderabbitai help       — Hilfe anzeigen
```

### WIP-PRs
PRs mit "WIP" oder "DO NOT MERGE" im Titel werden **nicht** automatisch reviewt.

## CI Integration

Die GitHub Actions CI-Pipeline (`.github/workflows/ci.yml`) läuft parallel zu CodeRabbit:
- **Typecheck**: `bun x tsc --noEmit`
- **Tests**: `bun test`

CodeRabbit sieht den CI-Status und kann darauf in Reviews verweisen.

## PR-Workflow

1. Branch erstellen: `git checkout -b feat/mein-feature`
2. Änderungen committen
3. PR öffnen: `gh pr create --title "feat: ..." --body "..."`
4. CodeRabbit reviewt automatisch
5. CI läuft (Typecheck + Tests)
6. Review-Kommentare bearbeiten
7. PR mergen nach Approval
