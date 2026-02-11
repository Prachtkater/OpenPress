import { FeatureManifestSchema, type FeatureManifest } from '@openpress/schemas'
import { join } from 'node:path'
import { existsSync, readFileSync, readdirSync } from 'node:fs'

const MANIFEST_FILENAME = 'openpress.feature.json'
const OPENPRESS_FEATURE_PREFIX = '@openpress/feature-'

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
 * Checks if a module name follows the @openpress/feature-* naming convention.
 */
export function isOpenPressFeature(moduleName: string): boolean {
  return moduleName.startsWith(OPENPRESS_FEATURE_PREFIX)
}

/**
 * Resolves the root directory of an installed npm package.
 * Checks node_modules first, then falls back to workspace packages directory.
 * Returns null if the package cannot be found.
 */
export function resolvePackageDir(moduleName: string, rootDir: string): string | null {
  // 1. Check node_modules (handles both installed deps and workspace symlinks)
  const nmCandidate = join(rootDir, 'node_modules', moduleName)
  if (existsSync(join(nmCandidate, 'package.json'))) {
    return nmCandidate
  }

  // 2. Fallback: check workspace packages directory (monorepo dev)
  //    Maps @openpress/feature-foo → packages/feature-foo
  if (moduleName.startsWith('@openpress/')) {
    const shortName = moduleName.replace('@openpress/', '')
    const wsCandidate = join(rootDir, 'packages', shortName)
    if (existsSync(join(wsCandidate, 'package.json'))) {
      return wsCandidate
    }
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
 * Scans workspace packages directory for @openpress/feature-* packages
 * that have an openpress.feature.json manifest.
 *
 * This auto-discovers features without requiring them to be listed
 * in the Nuxt modules config — useful for workspace development.
 */
export function scanWorkspaceFeatures(rootDir: string): string[] {
  const packagesDir = join(rootDir, 'packages')
  if (!existsSync(packagesDir)) return []

  const featureNames: string[] = []

  try {
    const entries = readdirSync(packagesDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (!entry.name.startsWith('feature-')) continue

      const manifestPath = join(packagesDir, entry.name, MANIFEST_FILENAME)
      if (existsSync(manifestPath)) {
        featureNames.push(`@openpress/${entry.name}`)
      }
    }
  } catch {
    // packages directory not readable — skip silently
  }

  return featureNames
}

/**
 * Scans a list of Nuxt module names for openpress.feature.json manifests.
 * Also auto-discovers workspace features not listed in modules config.
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
  const seen = new Set<string>()

  // Merge explicit module names with auto-discovered workspace features
  const workspaceFeatures = scanWorkspaceFeatures(rootDir)
  const allModuleNames = [...moduleNames, ...workspaceFeatures]

  for (const moduleName of allModuleNames) {
    // Deduplicate: a feature listed in modules AND found in workspace
    if (seen.has(moduleName)) continue
    seen.add(moduleName)

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
