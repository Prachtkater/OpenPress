import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { join } from 'node:path'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import {
  readManifest,
  discoverFeatures,
  extractModuleNames,
  resolvePackageDir,
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
    // Create a fake package with a manifest
    const pkgDir = join(FIXTURES_DIR, 'node_modules', '@openpress', 'feature-test')
    mkdirSync(pkgDir, { recursive: true })

    writeFileSync(
      join(pkgDir, 'package.json'),
      JSON.stringify({ name: '@openpress/feature-test', version: '1.0.0', main: 'index.js' })
    )
    writeFileSync(
      join(pkgDir, 'openpress.feature.json'),
      JSON.stringify({
        name: '@openpress/feature-test',
        label: 'Test Feature',
        blocks: [{ type: 'test-block', label: 'Test Block' }],
      })
    )

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
    // Create a fake package WITHOUT a manifest
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
      const pkgDir = join(FIXTURES_DIR, 'node_modules', '@openpress', name)
      mkdirSync(pkgDir, { recursive: true })

      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({ name: `@openpress/${name}`, version: '1.0.0', main: 'index.js' })
      )
      writeFileSync(
        join(pkgDir, 'openpress.feature.json'),
        JSON.stringify({
          name: `@openpress/${name}`,
          label: name,
          blocks: [{ type: `${name}-block`, label: `${name} Block` }],
        })
      )
    }

    const result = await discoverFeatures(
      ['@openpress/feature-a', '@openpress/feature-b'],
      FIXTURES_DIR
    )

    expect(result.features).toHaveLength(2)
    expect(result.errors).toEqual([])
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

  it('resolves an installed package directory', () => {
    const pkgDir = join(FIXTURES_DIR, 'node_modules', 'test-pkg')
    mkdirSync(pkgDir, { recursive: true })
    writeFileSync(
      join(pkgDir, 'package.json'),
      JSON.stringify({ name: 'test-pkg', version: '1.0.0' })
    )

    const result = resolvePackageDir('test-pkg', FIXTURES_DIR)
    expect(result).toBe(pkgDir)
  })
})
