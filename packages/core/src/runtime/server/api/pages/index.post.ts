import { defineEventHandler, readBody, createError, setResponseStatus } from 'h3'
import { ulid } from 'ulid'
import { CreatePageInputSchema, type Page } from '@openpress/schemas'
import { useStorageEngine } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = CreatePageInputSchema.safeParse(body)
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

  const now = new Date().toISOString()
  const page: Page = {
    id: ulid(),
    slug: result.data.slug,
    title: result.data.title,
    meta: result.data.meta ?? {},
    sections: result.data.sections ?? [],
    updatedAt: now,
    createdAt: now,
  }

  await engine.writePage(page.slug, page)

  const config = useRuntimeConfig()
  if (config.openpress.autoCommit) {
    await engine.commit(`content: create page '${page.slug}'`)
  }

  setResponseStatus(event, 201)
  return page
})
