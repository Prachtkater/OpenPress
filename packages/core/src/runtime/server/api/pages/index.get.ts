import { defineEventHandler } from 'h3'
import { useStorageEngine } from '../../utils/storage'

export default defineEventHandler(async () => {
  const engine = await useStorageEngine()
  return await engine.listPages()
})
