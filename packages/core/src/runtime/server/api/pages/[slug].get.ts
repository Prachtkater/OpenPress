import { defineEventHandler, getRouterParam, createError, getQuery } from 'h3'
import { useStorageEngine } from '../../utils/storage'
import { FileIOError } from '../../lib/storage-engine'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const locale = query.locale as string | undefined

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug required' })
  }

  const engine = await useStorageEngine()
  try {
    return await engine.readPage(slug, locale)
  } catch (error) {
    if (error instanceof FileIOError) {
      throw createError({ statusCode: 404, message: `Page '${slug}' not found` })
    }
    throw error
  }
})
