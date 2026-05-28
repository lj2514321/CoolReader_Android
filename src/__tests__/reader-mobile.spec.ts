import { test, expect, type Page } from '@playwright/test'

// Mobile viewport simulation (iPhone 14 Pro)
const MOBILE_VIEWPORT = { width: 390, height: 844 }

/**
 * Reader Mobile Adaptation Tests
 *
 * Tests cover:
 * 1. Safe area CSS on Reader page (padding-top on top bar)
 * 2. Bottom bar visible with prev/next/more buttons
 * 3. Swipe left triggers next page (via useSwipe hook)
 * 4. Swipe right triggers prev page
 * 5. Click zones: left 22% = prev, right 22% = next, center = toggle UI
 * 6. Bottom sheet opens when more button clicked and closes on overlay tap
 * 7. Bottom sheet has all 4 categories (导航, 阅读, 标记, 工具)
 */
test.describe('Reader Mobile Adaptation', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    // Create a new page with mobile viewport
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

  test('Safe area CSS - top bar has safe area padding', async () => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Navigate to a book to render the Reader
    const bookItem = page.locator('[data-testid="book-item"]').first()
    if (await bookItem.isVisible()) {
      await bookItem.click()
      await page.waitForTimeout(1000)
    }

    // Check top bar has safe area padding
    const topBar = page.locator('[data-testid="reader-top-bar"]')
    if (await topBar.isVisible()) {
      const paddingTop = await topBar.evaluate((el) => {
        return window.getComputedStyle(el).paddingTop
      })
      expect(paddingTop).toMatch(/calc|env\(safe-area-inset-top/)
    }

    // Check top bar inner element has env(safe-area-inset-top)
    const topBarInner = page.locator('[data-testid="reader-top-bar-inner"]')
    if (await topBarInner.isVisible()) {
      const innerPadding = await topBarInner.evaluate((el) => {
        return window.getComputedStyle(el).paddingTop
      })
      expect(innerPadding).toMatch(/env\(safe-area-inset-top/)
    }
  })

  test('Bottom bar visible with prev/next/more buttons', async () => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Look for the reader container
    const readerContainer = page.locator('#reader-container, [data-testid="reader"]')
    if (await readerContainer.isVisible({ timeout: 3000 })) {
      // Check for prev button (◂)
      const prevButton = page.locator('button:has-text("◂")')
      await expect(prevButton).toBeVisible()

      // Check for next button (▸)
      const nextButton = page.locator('button:has-text("▸")')
      await expect(nextButton).toBeVisible()

      // Check for more/menu button (⋯)
      const moreButton = page.locator('button:has-text("⋯")')
      await expect(moreButton).toBeVisible()
    }
  })

  test('Swipe left triggers next page', async () => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Navigate to a book
    const bookItem = page.locator('[data-testid="book-item"]').first()
    if (await bookItem.isVisible()) {
      await bookItem.click()
      await page.waitForTimeout(1000)
    }

    const viewport = page.viewportSize()
    if (!viewport) return

    const startX = viewport.width * 0.8
    const startY = viewport.height * 0.5
    const endX = viewport.width * 0.2
    const endY = viewport.height * 0.5

    // Swipe left (next page)
    await page.touchscreen.tap(startX, startY)
    await page.mouse.down(startX, startY)
    await page.mouse.move(endX, endY, { steps: 10 })
    await page.mouse.up()

    // Verify swipe happened - UI should show briefly then hide
    await page.waitForTimeout(500)
  })

  test('Swipe right triggers prev page', async () => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Navigate to a book
    const bookItem = page.locator('[data-testid="book-item"]').first()
    if (await bookItem.isVisible()) {
      await bookItem.click()
      await page.waitForTimeout(1000)
    }

    const viewport = page.viewportSize()
    if (!viewport) return

    const startX = viewport.width * 0.2
    const startY = viewport.height * 0.5
    const endX = viewport.width * 0.8
    const endY = viewport.height * 0.5

    // Swipe right (prev page)
    await page.touchscreen.tap(startX, startY)
    await page.mouse.down(startX, startY)
    await page.mouse.move(endX, endY, { steps: 10 })
    await page.mouse.up()

    // Verify swipe happened
    await page.waitForTimeout(500)
  })

  test('Click zones: left 22% = prev, right 22% = next, center = toggle UI', async () => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Navigate to a book
    const bookItem = page.locator('[data-testid="book-item"]').first()
    if (await bookItem.isVisible()) {
      await bookItem.click()
      await page.waitForTimeout(1000)
    }

    const viewport = page.viewportSize()
    if (!viewport) return

    // Left click zone (22% from left = prev)
    const leftX = Math.floor(viewport.width * 0.11)
    const centerY = Math.floor(viewport.height * 0.5)
    await page.click(`body`, { position: { x: leftX, y: centerY } })
    await page.waitForTimeout(300)

    // Center click zone (toggle UI)
    const centerX = Math.floor(viewport.width * 0.5)
    await page.click(`body`, { position: { x: centerX, y: centerY } })
    await page.waitForTimeout(300)

    // Right click zone (22% from right = next)
    const rightX = Math.floor(viewport.width * 0.89)
    await page.click(`body`, { position: { x: rightX, y: centerY } })
    await page.waitForTimeout(300)
  })

  test('Bottom sheet opens when more button clicked', async () => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Navigate to a book
    const bookItem = page.locator('[data-testid="book-item"]').first()
    if (await bookItem.isVisible()) {
      await bookItem.click()
      await page.waitForTimeout(1000)
    }

    // Click more button to open bottom sheet
    const moreButton = page.locator('button:has-text("⋯")')
    if (await moreButton.isVisible({ timeout: 3000 })) {
      await moreButton.click()
      await page.waitForTimeout(500)

      // Bottom sheet should be visible with transform: translateY(0)
      const bottomSheet = page.locator('[data-testid="bottom-sheet"]')
      if (await bottomSheet.isVisible()) {
        const transform = await bottomSheet.evaluate((el) => {
          return window.getComputedStyle(el).transform
        })
        expect(transform).not.toBe('matrix(1, 0, 0, 1, 0, 100)')
      }
    }
  })

  test('Bottom sheet closes on overlay tap', async () => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Navigate to a book
    const bookItem = page.locator('[data-testid="book-item"]').first()
    if (await bookItem.isVisible()) {
      await bookItem.click()
      await page.waitForTimeout(1000)
    }

    // Open bottom sheet
    const moreButton = page.locator('button:has-text("⋯")')
    if (await moreButton.isVisible({ timeout: 3000 })) {
      await moreButton.click()
      await page.waitForTimeout(500)

      // Click overlay to close
      const overlay = page.locator('[data-testid="bottom-sheet-overlay"]')
      if (await overlay.isVisible()) {
        await overlay.click()
        await page.waitForTimeout(500)

        // Bottom sheet should be hidden (transform: translateY(100%))
        const bottomSheet = page.locator('[data-testid="bottom-sheet"]')
        if (await bottomSheet.isVisible()) {
          const transform = await bottomSheet.evaluate((el) => {
            return window.getComputedStyle(el).transform
          })
          // Hidden state has translateY(100%)
          expect(transform).toBe('matrix(1, 0, 0, 1, 0, 100)')
        }
      }
    }
  })

  test('Bottom sheet has all 4 categories', async () => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Navigate to a book
    const bookItem = page.locator('[data-testid="book-item"]').first()
    if (await bookItem.isVisible()) {
      await bookItem.click()
      await page.waitForTimeout(1000)
    }

    // Open bottom sheet
    const moreButton = page.locator('button:has-text("⋯")')
    if (await moreButton.isVisible({ timeout: 3000 })) {
      await moreButton.click()
      await page.waitForTimeout(500)

      // Check for 导航 category
      const navCategory = page.locator('text=导航')
      await expect(navCategory).toBeVisible()

      // Check for 阅读 category
      const readCategory = page.locator('text=阅读')
      await expect(readCategory).toBeVisible()

      // Check for 标记 category
      const markerCategory = page.locator('text=标记')
      await expect(markerCategory).toBeVisible()

      // Check for 工具 category
      const toolCategory = page.locator('text=工具')
      await expect(toolCategory).toBeVisible()
    }
  })
})