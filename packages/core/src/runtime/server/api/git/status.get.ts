import { defineEventHandler } from 'h3'
import { useStorageEngine } from '../../utils/storage'

export default defineEventHandler(async () => {
  const engine = await useStorageEngine()
  const hasChanges = await engine.hasChanges()
  return { hasChanges }
})
