/**
 * Dev Server Health Check Script
 *
 * Starts the playground dev server and verifies all endpoints respond correctly.
 * Usage: bun run scripts/health-check.ts [--base-url http://localhost:3000]
 */

const DEFAULT_BASE = 'http://localhost:3000'
const TIMEOUT_MS = 5000

interface CheckResult {
  endpoint: string
  status: number | 'error'
  ok: boolean
  ms: number
  error?: string
}

const ENDPOINTS = [
  // Public pages
  { path: '/', expect: 200 },
  { path: '/_edit', expect: 200 },

  // API: Pages
  { path: '/api/_openpress/pages', expect: 200 },

  // API: Site config
  { path: '/api/_openpress/site', expect: 200 },

  // API: Navigation
  { path: '/api/_openpress/navigation', expect: 200 },

  // API: Git status
  { path: '/api/_openpress/git/status', expect: 200 },

  // API: Features
  { path: '/api/_openpress/features', expect: 200 },
]

async function checkEndpoint(baseUrl: string, endpoint: { path: string; expect: number }): Promise<CheckResult> {
  const url = `${baseUrl}${endpoint.path}`
  const start = performance.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    const ms = Math.round(performance.now() - start)
    return {
      endpoint: endpoint.path,
      status: res.status,
      ok: res.status === endpoint.expect,
      ms,
    }
  } catch (err) {
    const ms = Math.round(performance.now() - start)
    return {
      endpoint: endpoint.path,
      status: 'error',
      ok: false,
      ms,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function main() {
  const baseUrl = process.argv.includes('--base-url')
    ? process.argv[process.argv.indexOf('--base-url') + 1]
    : DEFAULT_BASE

  console.log(`\nOpenPress Dev Server Health Check`)
  console.log(`Base URL: ${baseUrl}\n`)

  const results = await Promise.all(
    ENDPOINTS.map((ep) => checkEndpoint(baseUrl, ep))
  )

  // Print results
  const maxPath = Math.max(...results.map((r) => r.endpoint.length))
  for (const r of results) {
    const icon = r.ok ? '\u2713' : '\u2717'
    const status = typeof r.status === 'number' ? r.status : r.status
    const pad = ' '.repeat(maxPath - r.endpoint.length)
    const errorInfo = r.error ? ` (${r.error})` : ''
    console.log(`  ${icon} ${r.endpoint}${pad}  ${status}  ${r.ms}ms${errorInfo}`)
  }

  const passed = results.filter((r) => r.ok).length
  const total = results.length
  console.log(`\n  ${passed}/${total} endpoints healthy\n`)

  if (passed < total) {
    process.exit(1)
  }
}

main()
