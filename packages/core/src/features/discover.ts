import { FeatureManifestSchema, type FeatureManifest } from '@openpress/schemas'
import { join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'

const MANIFEST_FILENAME = 'openpress.feature.json'

export interface DiscoveredFeature {
  /** Parsed and validated manifest */
  manifest: FeatureManifest
  /** Absolute path to the package directory */
  packageDir: string
  /** Absolute path to the manifest file */
  manifestPath: string
}

export interface DiscoveryError {
  /** Module name that caused the error */
  moduleName: string
  /** Path that was checked */
  path: string
  /** Error message */
  message: string
}

export interface DiscoveryResult {
  features: DiscoveredFeature[]
  errors: DiscoveryError[]
}

/**
 * Resolves the root directory of an installed npm package.
 * Checks the node_modules directory of the given rootDir.
 * Returns null if the package cannot be found.
 */
export function resolvePackageDir(moduleName: string, rootDir: string): string | null {
  const candidate = join(rootDir, 'node_modules', moduleName)
  const pkgJson = join(candidate, 'package.json')

  if (existsSync(pkgJson)) {
    return candidate
  }

  return null
}

/**
 * Reads and validates an openpress.feature.json manifest file.
 * Returns the parsed manifest or throws with a descriptive error.
 */
export async function readManifest(manifestPath: string): Promise<FeatureManifest> {
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`)
  }

  const rawContent = readFileSync(manifestPath, 'utf-8')
  const raw = JSON.parse(rawContent)
  const result = FeatureManifestSchema.safeParse(raw)

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid manifest at ${manifestPath}:\n${issues}`)
  }

  return result.data
}

/**
 * Scans a list of Nuxt module names for openpress.feature.json manifests.
 *
 * For each module, resolves its installed package directory and checks
 * for the presence of an openpress.feature.json file. Valid manifests
 * are returned as DiscoveredFeatures; invalid or missing ones are
 * collected as DiscoveryErrors.
 */
export async function discoverFeatures(
  moduleNames: string[],
  rootDir: string,
): Promise<DiscoveryResult> {
  const features: DiscoveredFeature[] = []
  const errors: DiscoveryError[] = []

  for (const moduleName of moduleNames) {
    const packageDir = resolvePackageDir(moduleName, rootDir)

    if (!packageDir) {
      // Module not installed or not resolvable — skip silently.
      // Not all Nuxt modules are OpenPress features.
      continue
    }

    const manifestPath = join(packageDir, MANIFEST_FILENAME)

    if (!existsSync(manifestPath)) {
      // No manifest → not an OpenPress feature. Skip silently.
      continue
    }

    try {
      const manifest = await readManifest(manifestPath)
      features.push({ manifest, packageDir, manifestPath })
    } catch (err) {
      errors.push({
        moduleName,
        path: manifestPath,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return { features, errors }
}

/**
 * Extracts Nuxt module names from the Nuxt configuration.
 * Handles both string module names and inline module definitions.
 */
export function extractModuleNames(modules: unknown[]): string[] {
  const names: string[] = []

  for (const mod of modules) {
    if (typeof mod === 'string') {
      names.push(mod)
    } else if (Array.isArray(mod) && typeof mod[0] === 'string') {
      // [moduleName, options] tuple format
      names.push(mod[0])
    }
    // Inline function modules are skipped — they can't have a manifest
  }

  return names
}
