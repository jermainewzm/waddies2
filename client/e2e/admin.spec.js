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

  test('admin can approve a hawker application', async ({ page }) => {

    // create a unique hawker application first
    const timestamp = Date.now()
    const stallName = `Playwright Approval Stall ${timestamp}`
    const unitNo = `#APP-${timestamp}`

    await page.goto('http://localhost:5173/hawker/apply')

    await expect(
      page.getByLabel('Hawker centre')
    ).toBeEnabled()

    await page
      .getByLabel('Hawker centre')
      .selectOption({ index: 1 })

    await page
      .getByLabel('Stall name')
      .fill(stallName)

    await page
      .getByLabel('Unit number')
      .fill(unitNo)

    await page
      .getByRole('button', { name: /submit application/i })
      .click()

    await expect(page)
      .toHaveURL(/\/hawker\/status/)


    // now log in as admin
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


    // the newly-created application should appear
    await expect(
      page.getByText(stallName)
    ).toBeVisible()

    // approve it
    const requestRow = page
      .locator('.request-row')
      .filter({ hasText: stallName })

    await expect(requestRow).toBeVisible()

    await requestRow
      .getByRole('button', { name: /approve/i })
      .click()

    // application should no longer be pending
    await expect(
      page.getByText(new RegExp(`${stallName} approved\\. Their Hawker ID is HAWKER_\\d+`, 'i'))
    ).toBeVisible()

    await expect(requestRow).toBeHidden()

  })

})