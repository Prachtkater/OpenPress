import { defineEventHandler, readBody, createError } from 'h3'
import { useStorageEngine } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { hash, slug } = body

  if (!hash || typeof hash !== 'string') {
    throw createError({ statusCode: 422, statusMessage: 'Commit hash is required for undo' })
  }

  const engine = await useStorageEngine()
  await engine.rollback(hash, slug)

  return { success: true }
})
