import { defineEventHandler, readBody } from 'h3'
import { useStorageEngine } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { hash, slug } = body

  if (!hash) {
    throw new Error('Commit hash is required for undo')
  }

  const engine = await useStorageEngine()
  await engine.rollback(hash, slug)
  
  return { success: true }
})
