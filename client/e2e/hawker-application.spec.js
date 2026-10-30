import { test, expect } from '@playwright/test'

test.describe('Hawker Application', () => {

  test('new hawker can open application page', async ({ page }) => {
    await page.goto('http://localhost:5173/hawker/apply')

    await expect(
      page.getByRole('heading', { name: 'Apply for a Stall' })
    ).toBeVisible()
  })


  test('application requires required fields', async ({ page }) => {
    await page.goto('http://localhost:5173/hawker/apply')

    await page
      .getByRole('button', { name: /submit application/i })
      .click()

    await expect(
      page.getByText(
        'Please choose a centre and fill in your stall name and unit number.'
      )
    ).toBeVisible()
  })


  test('new hawker can submit an application', async ({ page }) => {
    await page.goto('http://localhost:5173/hawker/apply')

    // Wait until centres have finished loading
    await expect(page.getByLabel('Hawker centre')).toBeEnabled()

    // Pick first real centre after placeholder
    await page
      .getByLabel('Hawker centre')
      .selectOption({ index: 1 })

    await page
      .getByLabel('Stall name')
      .fill('Playwright Test Stall')

    // Make this unique so repeated tests don't collide
    const uniqueUnit =
      `#PW-${Date.now()}`

    await page
      .getByLabel('Unit number')
      .fill(uniqueUnit)

    await page
      .getByLabel(/message for admin|shoutout for customers/i)
      .fill('Playwright test application')

    await page
      .getByRole('button', { name: /submit application/i })
      .click()

    await expect(page)
      .toHaveURL(/\/hawker\/status/)

    await expect(
      page.getByRole('heading', { name: 'Still waiting' })
    ).toBeVisible()
  })

})