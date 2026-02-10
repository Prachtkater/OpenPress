import { defineEventHandler, getQuery } from 'h3'
import { useStorageEngine } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const slug = query.slug as string | undefined

  const engine = await useStorageEngine()
  return await engine.getHistory(slug)
})
