import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { join } from 'node:path'
import { writeFile, mkdir } from 'node:fs/promises'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No form data received'
    })
  }

  const results = []
  // In a real Nuxt module, these options would come from runtimeConfig or options
  const uploadDir = join(process.cwd(), 'public', '_openpress', 'media')
  
  await mkdir(uploadDir, { recursive: true })

  for (const file of formData) {
    if (file.name !== 'file' || !file.filename) continue

    const id = uuidv4()
    const baseFilename = `${id}`
    const originalExtension = file.filename.split('.').pop()
    
    // Save original if it's not too big or keep it as reference
    // But the requirement says WebP conversion and responsive generation
    
    const sharpInstance = sharp(file.data)
    const metadata = await sharpInstance.metadata()

    // 1. Convert to WebP (Original size)
    const webpFilename = `${baseFilename}.webp`
    const webpPath = join(uploadDir, webpFilename)
    await sharpInstance.webp({ quality: 80 }).toFile(webpPath)

    // 2. Generate Responsive Sizes
    const sizes = [
      { name: 'sm', width: 640 },
      { name: 'md', width: 1024 },
      { name: 'lg', width: 1920 }
    ]

    const variants = {
      original: `/_openpress/media/${webpFilename}`
    }

    for (const size of sizes) {
      if (metadata.width && metadata.width > size.width) {
        const variantFilename = `${baseFilename}-${size.name}.webp`
        const variantPath = join(uploadDir, variantFilename)
        await sharp(file.data)
          .resize(size.width)
          .webp({ quality: 80 })
          .toFile(variantPath)
        variants[size.name] = `/_openpress/media/${variantFilename}`
      }
    }

    results.push({
      id,
      filename: file.filename,
      mimeType: 'image/webp',
      variants
    })
  }

  return results
})
