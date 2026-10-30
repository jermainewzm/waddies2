import { test, expect } from '@playwright/test'

test.describe('Hawker Dashboard', () => {

  test.beforeEach(async ({ page }) => {

    await page.goto(
      'http://localhost:5173/hawker/login'
    )

    await page
      .getByLabel('Hawker ID')
      .fill('HAWKER_001')

    await page
      .getByLabel('Stall name')
      .fill('Sunrise Chicken Rice')

    await page
      .getByRole('button', { name: /log in/i })
      .click()

    await expect(page)
      .toHaveURL(/\/hawker\/dashboard/)
  })


  test('logged in hawker can view dashboard', async ({ page }) => {

    await expect(
      page.getByRole('heading', {
        name: 'Hawker Dashboard'
      })
    ).toBeVisible()

  })


  test('hawker dashboard loads stall information', async ({ page }) => {

    await expect(
      page.locator('.stall-name')
    ).toBeVisible()

    await expect(
      page.locator('.stall-unit')
    ).toBeVisible()

    await expect(
      page.getByText(/unable to load your stall/i)
    ).not.toBeVisible()

  })


  test('hawker can update stall status', async ({ page }) => {

    const soldOutButton =
      page.getByRole('button', {
        name: 'Sold Out'
      })

    await soldOutButton.click()

    await expect(soldOutButton)
      .toHaveClass(/pressed/)

    await expect(
      page.getByText(/current status:/i)
    ).toContainText('Sold Out')

  })

})