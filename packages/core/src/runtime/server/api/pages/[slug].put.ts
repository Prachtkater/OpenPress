import { defineEventHandler, getRouterParam, readBody, createError, setResponseStatus, getQuery } from 'h3'
import { PageSchema } from '@openpress/schemas'
import { useStorageEngine } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const locale = query.locale as string | undefined

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug required' })
  }

  const body = await readBody(event)
  const result = PageSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      message: 'Validation failed',
      data: result.error.issues,
    })
  }

  const engine = await useStorageEngine()
  await engine.writePage(slug, result.data, locale)

  const config = useRuntimeConfig()
  if (config.openpress.autoCommit) {
    const localeSuffix = locale ? ` [${locale}]` : ''
    await engine.commit(`content: update page '${slug}'${localeSuffix}`)
  }

  setResponseStatus(event, 200)
  return result.data
})
