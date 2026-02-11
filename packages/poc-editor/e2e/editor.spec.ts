import { test, expect } from '@playwright/test'

test.describe('OpenPress Visual Editor', () => {
  test('should load the editor dashboard', async ({ page }) => {
    // Navigate to the editor path
    await page.goto('/_edit')
    
    // Check for the main editor container (Shadow DOM isolation)
    const editorContainer = page.locator('op-editor-container')
    await expect(editorContainer).toBeVisible()
  })

  test('should open media library', async ({ page }) => {
    await page.goto('/_edit')
    
    // Trigger media library (simulated click on a media action)
    // This will be refined once the exact selector is stable in Tailwind v4 UI
    await page.keyboard.press('m') 
    
    const mediaPicker = page.locator('.op-media-picker')
    await expect(mediaPicker).toBeVisible()
  })
})
