import { defineEventHandler, readBody, createError, setResponseStatus } from 'h3'
import { PageSchema } from '@openpress/schemas'
import { useStorageEngine } from '../../utils/storage'

export default defineEventHandler(async (event) => {
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

  if (await engine.pageExists(result.data.slug)) {
    throw createError({
      statusCode: 409,
      message: `Page '${result.data.slug}' already exists`,
    })
  }

  await engine.writePage(result.data.slug, result.data)

  const config = useRuntimeConfig()
  if (config.openpress.autoCommit) {
    await engine.commit(`content: create page '${result.data.slug}'`)
  }

  setResponseStatus(event, 201)
  return result.data
})
