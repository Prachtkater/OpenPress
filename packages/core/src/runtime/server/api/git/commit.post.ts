import { defineEventHandler, readBody, createError } from 'h3'
import { useStorageEngine } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const message = body?.message
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Commit message required' })
  }

  const engine = await useStorageEngine()

  if (!(await engine.hasChanges())) {
    throw createError({ statusCode: 409, message: 'No changes to commit' })
  }

  const result = await engine.commit(message.trim())
  return result
})
