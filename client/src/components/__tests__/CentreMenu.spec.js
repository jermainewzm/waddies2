// Component tests for CentreMenu.vue: props in, the toggle-stall event out
import { describe, test, expect } from "vitest"
import { mount } from "@vue/test-utils"
import CentreMenu from "../CentreMenu.vue"

//one stall with 2 dishes, used by most tests
const chickenRice = {
  stall_id: "s1",
  name: "Ah Tan Chicken Rice",
  unit_no: "#01-10",
  dishes: [
    { dish_id: "d1", name: "Roasted chicken rice", price: 4.5, tags: ["halal"] },
    { dish_id: "d2", name: "Steamed chicken rice", price: 4, tags: ["halal"] }
  ]
}

//mounts the menu with sensible props; each test only changes what it's checking
function mountMenu(props = {}) {
  return mount(CentreMenu, {
    props: {
      stalls: [chickenRice],
      closedStalls: [],
      openStallIds: [],
      hasAnyStalls: true,
      dateLabel: "Fri, 30 Oct",
      ...props
    }
  })
}

describe("CentreMenu", () => {
  test("shows each stall with its cheapest price", () => {
    const wrapper = mountMenu()
    expect(wrapper.text()).toContain("Ah Tan Chicken Rice")
    expect(wrapper.text()).toContain("from $4.00")
  })

  test("dishes stay hidden until the stall is opened", () => {
    expect(mountMenu().text()).not.toContain("Roasted chicken rice")
    expect(mountMenu({ openStallIds: ["s1"] }).text()).toContain("Roasted chicken rice")
  })

  test("showAll opens every stall (while typing a dish name)", () => {
    expect(mountMenu({ showAll: true }).text()).toContain("Steamed chicken rice")
  })

  test("tapping a stall tells the page which one (emits toggle-stall)", async () => {
    const wrapper = mountMenu()
    await wrapper.get("button").trigger("click")
    expect(wrapper.emitted("toggle-stall")).toEqual([["s1"]])
  })

  test("closed stalls show why they're closed", () => {
    const wrapper = mountMenu({
      closedStalls: [{ stall_id: "s2", name: "Kopi Corner", unit_no: "#01-11", reason: "Rest day on Fridays" }]
    })
    expect(wrapper.text()).toContain("Not open on Fri, 30 Oct")
    expect(wrapper.text()).toContain("Kopi Corner")
    expect(wrapper.text()).toContain("Rest day on Fridays")
  })

  test("explains when no stall is open at all", () => {
    const wrapper = mountMenu({ stalls: [], hasAnyStalls: false })
    expect(wrapper.text()).toContain("No stalls at this centre are open on Fri, 30 Oct.")
  })

  test("explains when the filters hide every dish", () => {
    const wrapper = mountMenu({ stalls: [], hasAnyStalls: true })
    expect(wrapper.text()).toContain("No dishes match your filters")
  })
})
