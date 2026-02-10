import { defineEventHandler, readBody, createError } from 'h3'
import { SiteConfigSchema } from '@openpress/schemas'
import { useStorageEngine } from '../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = SiteConfigSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      message: 'Validation failed',
      data: result.error.issues,
    })
  }

  const engine = await useStorageEngine()
  await engine.writeSiteConfig(result.data)

  const config = useRuntimeConfig()
  if (config.openpress.autoCommit) {
    await engine.commit('config: update site configuration')
  }

  return result.data
})
