import { test, expect } from '@playwright/test'

test.describe('Admin', () => {

  test('valid admin can log in', async ({ page }) => {

    await page.goto(
      'http://localhost:5173/admin/login'
    )

    await page
      .getByLabel(/admin id/i)
      .fill('admin_001')

    await page
      .getByRole('button', { name: /log in/i })
      .click()

    await expect(page)
      .toHaveURL(/\/admin\/dashboard/)

  })


  test('invalid admin cannot log in', async ({ page }) => {

    await page.goto(
      'http://localhost:5173/admin/login'
    )

    await page
      .getByLabel(/admin id/i)
      .fill('FAKE_ADMIN')

    await page
      .getByRole('button', { name: /log in/i })
      .click()

    await expect(
      page.getByText(/invalid admin/i)
    ).toBeVisible()

  })


  test('admin dashboard can display hawker applications', async ({ page }) => {

    // log in properly first
    await page.goto(
      'http://localhost:5173/admin/login'
    )

    await page
      .getByLabel(/admin id/i)
      .fill('admin_001')

    await page
      .getByRole('button', { name: /log in/i })
      .click()

    await expect(page)
      .toHaveURL(/\/admin\/dashboard/)

    // check dashboard loaded
    await expect(
      page.getByRole('heading', {
        name: 'Admin Dashboard'
      })
    ).toBeVisible()

    // check pending applications section exists
    await expect(
      page.getByRole('heading', {
        name: /pending applications/i
      })
    ).toBeVisible()

  })

})