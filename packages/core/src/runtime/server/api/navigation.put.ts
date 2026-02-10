import { defineEventHandler, readBody, createError } from 'h3'
import { NavigationSchema } from '@openpress/schemas'
import { useStorageEngine } from '../utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = NavigationSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      message: 'Validation failed',
      data: result.error.issues,
    })
  }

  const engine = await useStorageEngine()
  await engine.writeNavigation(result.data)

  const config = useRuntimeConfig()
  if (config.openpress.autoCommit) {
    await engine.commit('config: update navigation')
  }

  return result.data
})
