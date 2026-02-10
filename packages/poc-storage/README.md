# @openpress/poc-storage

**POC 1: Git-backed JSON Storage Engine**

## Ziel

Validierung der technischen Machbarkeit fuer:

- **Read**: JSON-Dateien aus dem Git-Repository lesen und parsen
- **Write**: Strukturierte JSON-Daten ins Dateisystem schreiben
- **Commit**: Aenderungen automatisch als Git-Commits speichern
- **Zod-Validierung**: Jede Read/Write-Operation gegen Zod-Schemas validieren
- **ULID-basierte IDs**: Persistente, sortierbare Block-Identifikatoren
- **Conflict Detection**: Erkennung konkurrierender Aenderungen

## Erfolgskriterien

1. Ein vollstaendiger Read/Write/Commit-Zyklus laeuft fehlerfrei
2. Schema-Validierung fängt invalide Daten zuverlaessig ab
3. Git-History ist sauber und nachvollziehbar
4. Performance: < 100ms fuer einzelne Page-Reads

## Technologie

- Bun File I/O (`Bun.file`, `Bun.write`)
- `simple-git` oder native Git CLI fuer Commits
- Zod fuer Schema-Validierung
- ULID fuer ID-Generierung

## Status

Phase 0 - Aktive Entwicklung
