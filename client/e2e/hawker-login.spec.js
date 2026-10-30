import { test, expect } from '@playwright/test'

const VALID_ID = 'HAWKER_001'
const VALID_STALL = 'Sunrise Chicken Rice'

test.describe('Hawker Login', () => {

  test('valid hawker can log in', async ({ page }) => {
    await page.goto('http://localhost:5173/hawker/login')

    await page
      .getByLabel('Hawker ID')
      .fill(VALID_ID)

    await page
      .getByLabel('Stall name')
      .fill(VALID_STALL)

    await page
      .getByRole('button', { name: /log in/i })
      .click()

    await expect(page)
      .toHaveURL(/\/hawker\/dashboard/)
  })


  test('wrong stall name prevents login', async ({ page }) => {
    await page.goto('http://localhost:5173/hawker/login')

    await page
      .getByLabel('Hawker ID')
      .fill(VALID_ID)

    await page
      .getByLabel('Stall name')
      .fill('Completely Wrong Stall Name')

    await page
      .getByRole('button', { name: /log in/i })
      .click()

    await expect(
      page.getByText(/hawker id or stall name is incorrect/i)
    ).toBeVisible()

    await expect(page)
      .toHaveURL(/\/hawker\/login/)
  })


  test('login requires both hawker ID and stall name', async ({ page }) => {
    await page.goto('http://localhost:5173/hawker/login')

    await page
      .getByLabel('Hawker ID')
      .fill(VALID_ID)

    await page
      .getByRole('button', { name: /log in/i })
      .click()

    await expect(
      page.getByText(/please enter your hawker id and stall name/i)
    ).toBeVisible()
  })


  test('hawker ID is case insensitive', async ({ page }) => {
    await page.goto('http://localhost:5173/hawker/login')

    await page
      .getByLabel('Hawker ID')
      .fill('hawker_001')

    await page
      .getByLabel('Stall name')
      .fill(VALID_STALL)

    await page
      .getByRole('button', { name: /log in/i })
      .click()

    await expect(page)
      .toHaveURL(/\/hawker\/dashboard/)
  })

})