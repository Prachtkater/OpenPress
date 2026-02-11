# Contributing to OpenPress

## Git Workflow

We use a **feature branch workflow**. All changes go through pull requests — direct commits to `main` are blocked by branch protection rules.

### Branch Naming

Use descriptive prefixes:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New features | `feat/inline-editor` |
| `fix/` | Bug fixes | `fix/navigation-ordering` |
| `refactor/` | Code restructuring | `refactor/storage-engine` |
| `docs/` | Documentation only | `docs/api-reference` |
| `chore/` | Tooling, deps, CI | `chore/upgrade-nuxt-4` |
| `test/` | Test additions/fixes | `test/page-tree-composable` |

### Working on a Feature

```bash
# 1. Start from an up-to-date main
git checkout main
git pull origin main

# 2. Create your feature branch
git checkout -b feat/my-feature

# 3. Make your changes, commit often
git add packages/core/src/my-file.ts
git commit -m "feat(core): add page versioning support"

# 4. Push your branch
git push -u origin feat/my-feature

# 5. Open a pull request
gh pr create --title "feat(core): add page versioning" --body "Description of changes"
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `ci`

**Scopes** match package names: `core`, `ui`, `schemas`, `theme-tailwind-plus`, `feature-contact-form`, `poc-storage`, `playground`

Examples:
- `feat(core): add HMR for content files`
- `fix(schemas): correct page slug validation`
- `chore(playground): update Nuxt config`
- `refactor(ui): extract theme engine into composable`

### Pull Request Process

1. **Create a PR** against `main` with a clear title and description
2. **CodeRabbit** automatically reviews every PR (configured in `.coderabbit.yaml`)
3. **Address review comments** — CodeRabbit uses `request_changes_workflow`, so resolve all threads
4. **All review threads must be resolved** before merging (enforced by branch rules)
5. **Merge** using squash merge for clean history, or regular merge for multi-commit PRs

### Branch Protection Rules

The `main` branch is protected with the following rules:

- All changes require a pull request (no direct pushes)
- Review threads must be resolved before merging
- Branch deletion is blocked
- Force pushes are blocked
- Repository admins can bypass in emergencies

### CodeRabbit Integration

[CodeRabbit](https://coderabbit.ai) is installed on this repository and reviews all PRs automatically.

- **Language:** Reviews are in German (de-DE)
- **Profile:** Chill — focuses on important issues, not nitpicks
- **Auto-reply:** Enabled — respond to CodeRabbit comments directly in the PR
- **Path-specific rules:** Different review focus per package (see `.coderabbit.yaml`)

To interact with CodeRabbit in a PR:
- Reply to its comments to ask follow-up questions
- Use `@coderabbitai` to request a re-review or ask questions

## Development Setup

```bash
# Clone and install
git clone https://github.com/Prachtkater/OpenPress.git
cd OpenPress
bun install

# Run the playground dev server
cd playground
bun run dev

# Run all tests
bun test

# Type-check
bun x tsc --noEmit
```

## Project Structure

```
packages/
  schemas/          # Zod schemas (block, section, page, site, navigation)
  core/             # Nuxt Module — HMR, feature discovery, editor routes
  ui/               # Glow-Frame UI Components & Theme Engine
  theme-*/          # Visual themes (strictly no logic)
  feature-*/        # Feature packages (strictly no visuals)
  poc-*/            # Proof-of-concept packages
playground/         # Nuxt dev environment
```

## Code Standards

- TypeScript strict mode everywhere
- Zod schemas as single source of truth for types — use `z.output<>` for types with `.default()`
- No `any` types — use `unknown` + type narrowing
- ULID for all persistent entity IDs
- Prefer `Bun.file()` / `Bun.write()` over Node.js `fs` API
- Features (logic) and Themes (visuals) are strictly separated
