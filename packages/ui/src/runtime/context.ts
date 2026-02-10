/**
 * Leichtgewichtiges Context-System (provide/inject Pattern ohne Vue).
 * Ermöglicht hierarchische State-Propagation für die Op-Komponenten.
 *
 * In einer Vue-Umgebung wird dies durch Vue's provide/inject ersetzt.
 * Diese Implementierung dient als Runtime-Logik und ist mit Bun testbar.
 */

const contextStore = new Map<symbol, unknown>()

/** Stellt einen Wert im Context bereit (analog zu Vue `provide`) */
export function provide<T>(key: symbol, value: T): void {
  contextStore.set(key, value)
}

/** Liest einen Wert aus dem Context (analog zu Vue `inject`) */
export function inject<T>(key: symbol): T | undefined {
  return contextStore.get(key) as T | undefined
}

/** Entfernt einen Wert aus dem Context */
export function revoke(key: symbol): void {
  contextStore.delete(key)
}

/** Leert den gesamten Context (für Tests) */
export function clearContext(): void {
  contextStore.clear()
}
