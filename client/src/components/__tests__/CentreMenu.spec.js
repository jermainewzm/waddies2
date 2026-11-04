// Component tests for CentreMenu.vue (the stall list): props in, the toggle-stall event out.
// No server needed. Run from client/:  pnpm exec vitest run src/components/__tests__/CentreMenu.spec.js

import { describe, test, expect } from "vitest"
import { mount } from "@vue/test-utils"
import CentreMenu from "../CentreMenu.vue"

//a stall with 2 dishes, for the tests below
const stall = {
  stall_id: "s1",
  name: "Ah Tan Chicken Rice",
  unit_no: "#01-10",
  dishes: [
    { dish_id: "d1", name: "Roasted chicken rice", price: 4.5, tags: ["halal"] },
    { dish_id: "d2", name: "Steamed chicken rice", price: 4, tags: ["halal"] }
  ]
}

describe("CentreMenu component", () => {
  test("shows the stall name and its cheapest price", () => {
    const wrapper = mount(CentreMenu, {
      props: { stalls: [stall], closedStalls: [], openStallIds: [], hasAnyStalls: true, dateLabel: "Fri, 30 Oct" }
    })
    expect(wrapper.text()).toContain("Ah Tan Chicken Rice")
    expect(wrapper.text()).toContain("from $4.00")
  })

  test("hides the dishes until the stall is opened", () => {
    // 1. closed: no dishes
    const closed = mount(CentreMenu, {
      props: { stalls: [stall], closedStalls: [], openStallIds: [], hasAnyStalls: true, dateLabel: "Fri, 30 Oct" }
    })
    expect(closed.text()).not.toContain("Roasted chicken rice")

    // 2. opened: dishes show
    const opened = mount(CentreMenu, {
      props: { stalls: [stall], closedStalls: [], openStallIds: ["s1"], hasAnyStalls: true, dateLabel: "Fri, 30 Oct" }
    })
    expect(opened.text()).toContain("Roasted chicken rice")
  })

  test("shows every dish when showAll is true", () => {
    const wrapper = mount(CentreMenu, {
      props: { stalls: [stall], closedStalls: [], openStallIds: [], hasAnyStalls: true, dateLabel: "Fri, 30 Oct", showAll: true }
    })
    expect(wrapper.text()).toContain("Steamed chicken rice")
  })

  test("emits toggle-stall with the stall id when a stall is clicked", async () => {
    const wrapper = mount(CentreMenu, {
      props: { stalls: [stall], closedStalls: [], openStallIds: [], hasAnyStalls: true, dateLabel: "Fri, 30 Oct" }
    })
    await wrapper.find("button").trigger("click")
    expect(wrapper.emitted("toggle-stall")).toBeTruthy()
    expect(wrapper.emitted("toggle-stall")[0]).toEqual(["s1"])
  })

  test("shows closed stalls and the reason", () => {
    const wrapper = mount(CentreMenu, {
      props: {
        stalls: [stall],
        closedStalls: [{ stall_id: "s2", name: "Kopi Corner", unit_no: "#01-11", reason: "Rest day on Fridays" }],
        openStallIds: [],
        hasAnyStalls: true,
        dateLabel: "Fri, 30 Oct"
      }
    })
    expect(wrapper.text()).toContain("Not open on Fri, 30 Oct")
    expect(wrapper.text()).toContain("Kopi Corner")
    expect(wrapper.text()).toContain("Rest day on Fridays")
  })

  test("says so when no stall is open that day", () => {
    const wrapper = mount(CentreMenu, {
      props: { stalls: [], closedStalls: [], openStallIds: [], hasAnyStalls: false, dateLabel: "Fri, 30 Oct" }
    })
    expect(wrapper.text()).toContain("No stalls at this centre are open on Fri, 30 Oct.")
  })

  test("says so when the filters hide every dish", () => {
    const wrapper = mount(CentreMenu, {
      props: { stalls: [], closedStalls: [], openStallIds: [], hasAnyStalls: true, dateLabel: "Fri, 30 Oct" }
    })
    expect(wrapper.text()).toContain("No dishes match your filters")
  })
})