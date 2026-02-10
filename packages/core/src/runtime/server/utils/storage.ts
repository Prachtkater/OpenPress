import { StorageEngine } from "../lib/storage-engine";
import type { StorageEngineOptions } from "../lib/storage-engine";

let _engine: StorageEngine | null = null;

export async function useStorageEngine(): Promise<StorageEngine> {
  if (_engine) return _engine;

  const config = useRuntimeConfig();
  const options: StorageEngineOptions = {
    contentDir: config.openpress.contentDir,
    repoRoot: config.openpress.repoRoot,
  };

  _engine = new StorageEngine(options);
  await _engine.init();
  return _engine;
}

/**
 * Reset the singleton (for testing purposes only).
 */
export function _resetStorageEngine(): void {
  _engine = null;
}
