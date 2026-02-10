import { defineEventHandler, getRouterParam, createError, setResponseStatus } from 'h3'
import { useStorageEngine } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug required' })
  }

  const engine = await useStorageEngine()

  if (!(await engine.pageExists(slug))) {
    throw createError({ statusCode: 404, message: `Page '${slug}' not found` })
  }

  await engine.deletePage(slug)

  const config = useRuntimeConfig()
  if (config.openpress.autoCommit) {
    await engine.commit(`content: delete page '${slug}'`)
  }

  setResponseStatus(event, 204)
  return null
})
