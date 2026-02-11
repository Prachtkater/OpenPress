import { defineEventHandler, getRouterParam, createError, setResponseStatus, getQuery } from 'h3'
import { useStorageEngine } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const locale = query.locale as string | undefined

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug required' })
  }

  const engine = await useStorageEngine()

  if (!(await engine.pageExists(slug, locale))) {
    throw createError({ statusCode: 404, message: `Page '${slug}' not found` })
  }

  await engine.deletePage(slug, locale)

  const config = useRuntimeConfig()
  if (config.openpress.autoCommit) {
    const localeSuffix = locale ? ` [${locale}]` : ''
    await engine.commit(`content: delete page '${slug}'${localeSuffix}`)
  }

  setResponseStatus(event, 204)
  return null
})
