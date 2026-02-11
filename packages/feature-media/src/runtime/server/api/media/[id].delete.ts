import { defineEventHandler, createError } from 'h3'
import { unlink, readdir } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID required' })
  }

  const uploadDir = join(process.cwd(), 'public', '_openpress', 'media')
  
  try {
    const files = await readdir(uploadDir)
    const filesToDelete = files.filter(f => f.startsWith(id))
    
    for (const file of filesToDelete) {
      await unlink(join(uploadDir, file))
    }

    return { success: true }
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete media' })
  }
})
