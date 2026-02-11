import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import {
  readManifest,
  discoverFeatures,
  extractModuleNames,
  resolvePackageDir,
  scanWorkspaceFeatures,
  isOpenPressFeature,
} from './discover'

// Temp directory for test fixtures
const FIXTURES_DIR = join(import.meta.dir, '__test_fixtures__')

function createFixture(relativePath: string, content: unknown): string {
  const fullPath = join(FIXTURES_DIR, relativePath)
  const dir = fullPath.substring(0, fullPath.lastIndexOf('/'))
  mkdirSync(dir, { recursive: true })
  writeFileSync(fullPath, JSON.stringify(content, null, 2))
  return fullPath
}

function createWorkspaceFeature(name: string, manifest: Record<string, unknown>): void {
  const pkgDir = join(FIXTURES_DIR, 'packages', name)
  mkdirSync(pkgDir, { recursive: true })
  writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ name: `@openpress/${name}`, version: '1.0.0' }))
  writeFileSync(join(pkgDir, 'openpress.feature.json'), JSON.stringify(manifest))
}

function createNodeModulesFeature(name: string, manifest: Record<string, unknown>): string {
  const pkgDir = join(FIXTURES_DIR, 'node_modules', '@openpress', name)
  mkdirSync(pkgDir, { recursive: true })
  writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ name: `@openpress/${name}`, version: '1.0.0', main: 'index.js' }))
  writeFileSync(join(pkgDir, 'openpress.feature.json'), JSON.stringify(manifest))
  return pkgDir
}

describe('isOpenPressFeature', () => {
  it('returns true for @openpress/feature-* names', () => {
    expect(isOpenPressFeature('@openpress/feature-contact-form')).toBe(true)
    expect(isOpenPressFeature('@openpress/feature-booking')).toBe(true)
    expect(isOpenPressFeature('@openpress/feature-x')).toBe(true)
  })

  it('returns false for non-feature packages', () => {
    expect(isOpenPressFeature('@openpress/core')).toBe(false)
    expect(isOpenPressFeature('@openpress/ui')).toBe(false)
    expect(isOpenPressFeature('@nuxt/kit')).toBe(false)
    expect(isOpenPressFeature('vue')).toBe(false)
  })
})

describe('extractModuleNames', () => {
  it('extracts string module names', () => {
    const result = extractModuleNames([
      '@openpress/feature-contact-form',
      '@openpress/feature-booking',
    ])
    expect(result).toEqual([
      '@openpress/feature-contact-form',
      '@openpress/feature-booking',
    ])
  })

  it('extracts names from [name, options] tuples', () => {
    const result = extractModuleNames([
      ['@openpress/feature-contact-form', { apiKey: 'test' }],
      '@openpress/i18n',
    ])
    expect(result).toEqual(['@openpress/feature-contact-form', '@openpress/i18n'])
  })

  it('skips inline function modules', () => {
    const result = extractModuleNames([
      '@openpress/feature-contact-form',
      () => {},
      { setup: () => {} },
    ])
    expect(result).toEqual(['@openpress/feature-contact-form'])
  })

  it('returns empty array for empty input', () => {
    expect(extractModuleNames([])).toEqual([])
  })
})

describe('readManifest', () => {
  beforeEach(() => {
    mkdirSync(FIXTURES_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(FIXTURES_DIR, { recursive: true, force: true })
  })

  it('reads and validates a valid manifest', async () => {
    const manifestPath = createFixture('valid/openpress.feature.json', {
      name: '@openpress/feature-contact-form',
      label: 'Contact Form',
      blocks: [
        {
          type: 'contact-form',
          label: 'Contact Form',
          description: 'A customizable contact form',
          category: 'Forms',
        },
      ],
    })

    const manifest = await readManifest(manifestPath)
    expect(manifest.name).toBe('@openpress/feature-contact-form')
    expect(manifest.label).toBe('Contact Form')
    expect(manifest.blocks).toHaveLength(1)
    expect(manifest.blocks[0].type).toBe('contact-form')
  })

  it('applies defaults for optional arrays', async () => {
    const manifestPath = createFixture('minimal/openpress.feature.json', {
      name: '@openpress/feature-test',
      label: 'Test Feature',
    })

    const manifest = await readManifest(manifestPath)
    expect(manifest.blocks).toEqual([])
    expect(manifest.editorPanels).toEqual([])
    expect(manifest.editorRoutes).toEqual([])
  })

  it('throws for missing manifest file', async () => {
    await expect(
      readManifest(join(FIXTURES_DIR, 'nonexistent/openpress.feature.json'))
    ).rejects.toThrow('Manifest not found')
  })

  it('throws for invalid manifest (missing required fields)', async () => {
    const manifestPath = createFixture('invalid/openpress.feature.json', {
      description: 'Missing name and label',
    })

    await expect(readManifest(manifestPath)).rejects.toThrow('Invalid manifest')
  })

  it('throws for invalid block definition', async () => {
    const manifestPath = createFixture('invalid-block/openpress.feature.json', {
      name: '@openpress/feature-bad',
      label: 'Bad Feature',
      blocks: [{ type: '' }], // empty type and missing label
    })

    await expect(readManifest(manifestPath)).rejects.toThrow('Invalid manifest')
  })
})

describe('resolvePackageDir', () => {
  beforeEach(() => {
    mkdirSync(FIXTURES_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(FIXTURES_DIR, { recursive: true, force: true })
  })

  it('returns null for a non-existent package', () => {
    const result = resolvePackageDir('@nonexistent/package-xyz', FIXTURES_DIR)
    expect(result).toBeNull()
  })

  it('resolves an installed package from node_modules', () => {
    const pkgDir = join(FIXTURES_DIR, 'node_modules', 'test-pkg')
    mkdirSync(pkgDir, { recursive: true })
    writeFileSync(
      join(pkgDir, 'package.json'),
      JSON.stringify({ name: 'test-pkg', version: '1.0.0' })
    )

    const result = resolvePackageDir('test-pkg', FIXTURES_DIR)
    expect(result).toBe(pkgDir)
  })

  it('resolves @openpress/* packages from workspace packages directory', () => {
    const pkgDir = join(FIXTURES_DIR, 'packages', 'feature-test')
    mkdirSync(pkgDir, { recursive: true })
    writeFileSync(
      join(pkgDir, 'package.json'),
      JSON.stringify({ name: '@openpress/feature-test', version: '1.0.0' })
    )

    const result = resolvePackageDir('@openpress/feature-test', FIXTURES_DIR)
    expect(result).toBe(pkgDir)
  })

  it('prefers node_modules over workspace when both exist', () => {
    // node_modules version
    const nmDir = join(FIXTURES_DIR, 'node_modules', '@openpress', 'feature-test')
    mkdirSync(nmDir, { recursive: true })
    writeFileSync(join(nmDir, 'package.json'), JSON.stringify({ name: '@openpress/feature-test', version: '2.0.0' }))

    // workspace version
    const wsDir = join(FIXTURES_DIR, 'packages', 'feature-test')
    mkdirSync(wsDir, { recursive: true })
    writeFileSync(join(wsDir, 'package.json'), JSON.stringify({ name: '@openpress/feature-test', version: '1.0.0' }))

    const result = resolvePackageDir('@openpress/feature-test', FIXTURES_DIR)
    expect(result).toBe(nmDir) // node_modules takes priority
  })
})

describe('scanWorkspaceFeatures', () => {
  beforeEach(() => {
    mkdirSync(FIXTURES_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(FIXTURES_DIR, { recursive: true, force: true })
  })

  it('returns empty array when no packages directory exists', () => {
    expect(scanWorkspaceFeatures(join(FIXTURES_DIR, 'nonexistent'))).toEqual([])
  })

  it('discovers feature-* packages with manifests', () => {
    createWorkspaceFeature('feature-forms', {
      name: '@openpress/feature-forms',
      label: 'Forms',
    })
    createWorkspaceFeature('feature-gallery', {
      name: '@openpress/feature-gallery',
      label: 'Gallery',
    })

    const result = scanWorkspaceFeatures(FIXTURES_DIR)
    expect(result).toContain('@openpress/feature-forms')
    expect(result).toContain('@openpress/feature-gallery')
    expect(result).toHaveLength(2)
  })

  it('skips non-feature packages', () => {
    // Create core package (not a feature)
    const coreDir = join(FIXTURES_DIR, 'packages', 'core')
    mkdirSync(coreDir, { recursive: true })
    writeFileSync(join(coreDir, 'package.json'), JSON.stringify({ name: '@openpress/core' }))

    // Create a feature
    createWorkspaceFeature('feature-test', {
      name: '@openpress/feature-test',
      label: 'Test',
    })

    const result = scanWorkspaceFeatures(FIXTURES_DIR)
    expect(result).toEqual(['@openpress/feature-test'])
  })

  it('skips feature-* packages without a manifest', () => {
    // Package without manifest
    const pkgDir = join(FIXTURES_DIR, 'packages', 'feature-no-manifest')
    mkdirSync(pkgDir, { recursive: true })
    writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ name: '@openpress/feature-no-manifest' }))

    const result = scanWorkspaceFeatures(FIXTURES_DIR)
    expect(result).toEqual([])
  })
})

describe('discoverFeatures', () => {
  beforeEach(() => {
    mkdirSync(FIXTURES_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(FIXTURES_DIR, { recursive: true, force: true })
  })

  it('returns empty result when no modules are provided', async () => {
    const result = await discoverFeatures([], FIXTURES_DIR)
    expect(result.features).toEqual([])
    expect(result.errors).toEqual([])
  })

  it('skips modules that cannot be resolved', async () => {
    const result = await discoverFeatures(
      ['@nonexistent/module'],
      FIXTURES_DIR
    )
    expect(result.features).toEqual([])
    expect(result.errors).toEqual([])
  })

  it('discovers a feature with a valid manifest', async () => {
    const pkgDir = createNodeModulesFeature('feature-test', {
      name: '@openpress/feature-test',
      label: 'Test Feature',
      blocks: [{ type: 'test-block', label: 'Test Block' }],
    })

    const result = await discoverFeatures(
      ['@openpress/feature-test'],
      FIXTURES_DIR
    )

    expect(result.features).toHaveLength(1)
    expect(result.features[0].manifest.name).toBe('@openpress/feature-test')
    expect(result.features[0].manifest.blocks).toHaveLength(1)
    expect(result.features[0].packageDir).toBe(pkgDir)
    expect(result.errors).toEqual([])
  })

  it('skips modules without a manifest (not a feature)', async () => {
    const pkgDir = join(FIXTURES_DIR, 'node_modules', '@nuxt', 'some-module')
    mkdirSync(pkgDir, { recursive: true })

    writeFileSync(
      join(pkgDir, 'package.json'),
      JSON.stringify({ name: '@nuxt/some-module', version: '1.0.0', main: 'index.js' })
    )

    const result = await discoverFeatures(
      ['@nuxt/some-module'],
      FIXTURES_DIR
    )

    expect(result.features).toEqual([])
    expect(result.errors).toEqual([])
  })

  it('collects errors for invalid manifests', async () => {
    const pkgDir = join(FIXTURES_DIR, 'node_modules', '@openpress', 'feature-bad')
    mkdirSync(pkgDir, { recursive: true })

    writeFileSync(
      join(pkgDir, 'package.json'),
      JSON.stringify({ name: '@openpress/feature-bad', version: '1.0.0', main: 'index.js' })
    )
    writeFileSync(
      join(pkgDir, 'openpress.feature.json'),
      JSON.stringify({ invalid: true }) // missing required fields
    )

    const result = await discoverFeatures(
      ['@openpress/feature-bad'],
      FIXTURES_DIR
    )

    expect(result.features).toEqual([])
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].moduleName).toBe('@openpress/feature-bad')
    expect(result.errors[0].message).toContain('Invalid manifest')
  })

  it('discovers multiple features', async () => {
    for (const name of ['feature-a', 'feature-b']) {
      createNodeModulesFeature(name, {
        name: `@openpress/${name}`,
        label: name,
        blocks: [{ type: `${name}-block`, label: `${name} Block` }],
      })
    }

    const result = await discoverFeatures(
      ['@openpress/feature-a', '@openpress/feature-b'],
      FIXTURES_DIR
    )

    expect(result.features).toHaveLength(2)
    expect(result.errors).toEqual([])
  })

  it('auto-discovers workspace features not listed in modules', async () => {
    createWorkspaceFeature('feature-ws', {
      name: '@openpress/feature-ws',
      label: 'Workspace Feature',
      blocks: [{ type: 'ws-block', label: 'WS Block' }],
    })

    // Pass empty modules — workspace scan should find it
    const result = await discoverFeatures([], FIXTURES_DIR)

    expect(result.features).toHaveLength(1)
    expect(result.features[0].manifest.name).toBe('@openpress/feature-ws')
  })

  it('deduplicates features found in both modules and workspace', async () => {
    // Same feature in both node_modules and workspace packages
    createNodeModulesFeature('feature-dup', {
      name: '@openpress/feature-dup',
      label: 'Duplicate Feature',
    })
    createWorkspaceFeature('feature-dup', {
      name: '@openpress/feature-dup',
      label: 'Duplicate Feature',
    })

    const result = await discoverFeatures(
      ['@openpress/feature-dup'],
      FIXTURES_DIR
    )

    // Should only appear once (from modules, since it's processed first)
    expect(result.features).toHaveLength(1)
  })
})
