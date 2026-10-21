import {
  test,
  expect
} from "@playwright/test"

const centreList = {
  date: "2026-10-07",

  count: 2,

  centres: [
    {
      id: "1",
      name: "Maxwell Food Centre",

      address:
        "1 Kadayanallur Street, Singapore",

      foodStalls: 103,
      marketStalls: 0,

      photoUrl: null,

      isOpen: true,
      currentClosure: null,

      crowd: {
        level: null,
        label: "No recent reports",
        count: 0
      }
    },

    {
      id: "2",
      name: "Hong Lim Food Centre",

      address:
        "531A Upper Cross Street, Singapore",

      foodStalls: 103,
      marketStalls: 0,

      photoUrl: null,

      isOpen: false,

      currentClosure: {
        label: "Q4 cleaning",
        start: "2026-10-07",
        end: "2026-10-08",
        remarks: ""
      },

      crowd: {
        level: "full",
        label: "Full",
        count: 3
      }
    }
  ]
}

const centreDetail = {
  ...centreList.centres[0],

  description:
    "A test hawker centre.",

  closurePeriods: [],

  stalls: [],

    shoutouts: [
    {
      _id: "shoutout-test-1",
      stall_id: "671000000000000000000101",
      stall_name: "Jurong Chicken Rice",
      stall_unit_no: "#02-15",
      message: "Fresh roast chicken available today!"
    }
  ]
}

test.beforeEach(
  async ({ page }) => {
    await page.route(
      "**/api/centres**",

      async (route) => {
        const request =
          route.request()

        const url =
          new URL(
            request.url()
          )

        if (
          request.method() ===
            "POST" &&
          url.pathname.endsWith(
            "/api/centres/1/crowd-reports"
          )
        ) {
          await route.fulfill({
            status: 201,

            contentType:
              "application/json",

            body: JSON.stringify({
              message:
                "Crowd report submitted.",

              crowd: {
                level: "plenty",
                label:
                  "Plenty of seats",
                count: 1
              }
            })
          })

          return
        }

        if (
          request.method() ===
            "GET" &&
          url.pathname.endsWith(
            "/api/centres/1"
          )
        ) {
          await route.fulfill({
            status: 200,

            contentType:
              "application/json",

            body:
              JSON.stringify(
                centreDetail
              )
          })

          return
        }

        if (
          request.method() ===
            "GET" &&
          url.pathname.endsWith(
            "/api/centres"
          )
        ) {
          await route.fulfill({
            status: 200,

            contentType:
              "application/json",

            body:
              JSON.stringify(
                centreList
              )
          })

          return
        }

        await route.continue()
      }
    )
  }
)

test(
  "centre list loads centres",
  async ({ page }) => {
    await page.goto(
      "/centres"
    )

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Hawker Centres"
        }
      )
    ).toBeVisible()

    await expect(
      page.getByText(
        "Maxwell Food Centre"
      )
    ).toBeVisible()
  }
)

test(
  "closed centre shows Closed",
  async ({ page }) => {
    await page.goto(
      "/centres"
    )

    const hongLimCard =
      page
        .getByTestId(
          "centre-card"
        )
        .filter({
          hasText:
            "Hong Lim Food Centre"
        })

    await expect(
      hongLimCard
    ).toContainText(
      "Closed"
    )
  }
)

test(
  "crowd report updates displayed crowd level",
  async ({ page }) => {
    await page.goto(
      "/centres/1"
    )

    await expect(
      page.getByTestId(
        "crowd-summary"
      )
    ).toContainText(
      "No recent reports"
    )

    await page
      .getByRole(
        "button",
        {
          name: "Plenty"
        }
      )
      .click()

    await expect(
      page.getByTestId(
        "crowd-summary"
      )
    ).toContainText(
      "Plenty of seats"
    )
  }
)

test(
  "centre without reports shows No recent reports",
  async ({ page }) => {
    await page.goto(
      "/centres/1"
    )

    await expect(
      page.getByTestId(
        "crowd-summary"
      )
    ).toContainText(
      "No recent reports"
    )
  }
)

test(
  "centre cards stack at 375px",
  async ({ page }) => {
    await page.setViewportSize({
      width: 375,
      height: 800
    })

    await page.goto(
      "/centres"
    )

    const cards =
      page.getByTestId(
        "centre-card"
      )

    await expect(cards).toHaveCount(
      2
    )

    const first =
      await cards
        .nth(0)
        .boundingBox()

    const second =
      await cards
        .nth(1)
        .boundingBox()

    expect(first).not.toBeNull()
    expect(second).not.toBeNull()

    expect(
      second.y
    ).toBeGreaterThan(
      first.y
    )
  }
)

test(
  "shoutout shows the stall that posted it",
  async ({ page }) => {
    await page.goto(
      "/centres/1"
    )

    await expect(
      page.getByText(
        "Jurong Chicken Rice"
      )
    ).toBeVisible()

    await expect(
      page.getByText(
        "Fresh roast chicken available today!"
      )
    ).toBeVisible()

    await expect(
      page.getByText(
        "#02-15"
      )
    ).toBeVisible()
  }
)