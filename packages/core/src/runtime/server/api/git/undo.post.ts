import { defineEventHandler, readBody, createError } from 'h3'
import { useStorageEngine } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 422, statusMessage: 'Request body must be a JSON object' })
  }

  const { hash, slug } = body as Record<string, unknown>

  if (!hash || typeof hash !== 'string') {
    throw createError({ statusCode: 422, statusMessage: 'Commit hash is required for undo' })
  }

  const validSlug = typeof slug === 'string' ? slug : undefined

  const engine = await useStorageEngine()
  await engine.rollback(hash, validSlug)

  return { success: true }
})
