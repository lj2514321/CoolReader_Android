import { test, expect, type Page } from '@playwright/test'

// Mobile viewport simulation (iPhone 14 Pro)
const MOBILE_VIEWPORT = { width: 390, height: 844 }

/**
 * Library Nav Tab Switching Tests
 *
 * Tests cover:
 * 1. Normal tab switch - click each nav button, wait 400ms, verify correct page
 * 2. Rapid tab switch (cancel-and-redirect) - click stats, within 150ms click settings,
 *    wait 400ms, assert settings is the final page
 * 3. Triple rapid click - stats → settings → books within 300ms, wait 400ms,
 *    assert books is the final page
 * 4. Same-page click is no-op - click books when already on books, page stays stable
 */
test.describe('Library Nav Tab Switching', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      isMobile: true,
      hasTouch: true,
    })
    page = await context.newPage()
  })

  test.afterEach(async () => {
    await page.close()
  })

  // Nav button locators
  const booksBtn = () => page.locator('button:has-text("📚")')
  const statsBtn = () => page.locator('button:has-text("📊")')
  const settingsBtn = () => page.locator('button:has-text("⚙")')

  test('Normal tab switch - click each nav button, verify correct page renders', async () => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Initially on books page - verify by checking for books-specific content
    await page.waitForTimeout(400)

    // Click stats tab
    await statsBtn().click()
    await page.waitForTimeout(400)
    // Stats page shows "📊 阅读统计" heading
    await expect(page.locator('text=📊 阅读统计')).toBeVisible()

    // Click settings tab
    await settingsBtn().click()
    await page.waitForTimeout(400)
    // Settings page shows "设置" heading
    await expect(page.locator('text=设置').first()).toBeVisible()

    // Click back to books tab
    await booksBtn().click()
    await page.waitForTimeout(400)
    // Books page shows "📥 导入书籍" button or has BookShelf content
    await expect(page.locator('text=📥 导入书籍')).toBeVisible()
  })

  test('Rapid tab switch (cancel-and-redirect) - click stats then quickly settings', async () => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    await page.waitForTimeout(400)

    // Click stats tab
    await statsBtn().click()

    // Within 150ms total, click settings (redirect before stats transition completes)
    await page.waitForTimeout(50)
    await settingsBtn().click()

    // Wait for animation to settle
    await page.waitForTimeout(400)

    // Final page should be settings
    await expect(page.locator('text=设置').first()).toBeVisible()
    // Stats heading should NOT be visible (transition was cancelled)
    await expect(page.locator('text=📊 阅读统计')).not.toBeVisible()
  })

  test('Triple rapid click - stats → settings → books within 300ms total', async () => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    await page.waitForTimeout(400)

    // Rapidly click: stats -> settings -> books (all within ~300ms)
    await statsBtn().click()
    await page.waitForTimeout(80)
    await settingsBtn().click()
    await page.waitForTimeout(80)
    await booksBtn().click()

    // Wait for animation to settle
    await page.waitForTimeout(400)

    // Final page should be books
    await expect(page.locator('text=📥 导入书籍')).toBeVisible()
  })

  test('Same-page click is no-op - click books when already on books', async () => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    await page.waitForTimeout(400)

    // Click books tab again when already on books - should be no-op
    await booksBtn().click()
    await page.waitForTimeout(400)

    // Page should stay stable on books
    await expect(page.locator('text=📥 导入书籍')).toBeVisible()

    // Verify we can still navigate normally after the no-op click
    await statsBtn().click()
    await page.waitForTimeout(400)
    await expect(page.locator('text=📊 阅读统计')).toBeVisible()

    // Navigate back to books
    await booksBtn().click()
    await page.waitForTimeout(400)
    await expect(page.locator('text=📥 导入书籍')).toBeVisible()
  })
})
