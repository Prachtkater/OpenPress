import { defineEventHandler, getRouterParam, createError } from 'h3'
import { useStorageEngine } from '../../utils/storage'
import { FileIOError } from '../../lib/storage-engine'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug required' })
  }

  const engine = await useStorageEngine()
  try {
    return await engine.readPage(slug)
  } catch (error) {
    if (error instanceof FileIOError) {
      throw createError({ statusCode: 404, message: `Page '${slug}' not found` })
    }
    throw error
  }
})
