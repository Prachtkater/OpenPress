import { defineEventHandler } from 'h3'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const uploadDir = join(process.cwd(), 'public', '_openpress', 'media')
  
  try {
    const files = await readdir(uploadDir)
    // Basic implementation: group files by ID (first part of filename)
    const mediaMap = new Map()

    files.forEach(file => {
      const parts = file.split('.')
      if (parts.length < 2) return
      
      const nameParts = parts[0].split('-')
      const id = nameParts[0]
      const size = nameParts[1] || 'original'

      if (!mediaMap.has(id)) {
        mediaMap.set(id, { id, variants: {} })
      }
      
      mediaMap.get(id).variants[size] = `/_openpress/media/${file}`
    })

    return Array.from(mediaMap.values())
  } catch (e) {
    return []
  }
})
