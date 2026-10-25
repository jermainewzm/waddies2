import { createRouter, createWebHistory } from "vue-router"

import HomeView from "../views/HomeView.vue"
import PlanLobby from "../views/PlanLobby.vue"
import SwipeLobby from "../views/SwipeLobby.vue"
import JourneyView from "../views/JourneyView.vue"
import CreatePlanView from "../views/CreatePlanView.vue"
import JoinPlanView from "../views/JoinPlanView.vue"
import CentresView from "../views/CentresView.vue"
import CentreSearch from "../views/CentreSearch.vue"
import CentreDetailView from "../views/CentreDetailView.vue"
import HawkerDashboard from "../views/HawkerDashboard.vue"
import NotFoundView from "@/views/NotFoundView.vue"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView
    },
    {
      path: "/plan/:code/lobby",
      name: "plan-lobby",
      component: PlanLobby
    },
    {
      path: "/plan/:code",
      name: "plan-direct",
      component: PlanLobby
    },
    {
      path: "/plan/:code/swipe",
      name: "plan-swipe",
      component: SwipeLobby
    },
    {
      path: "/plan/:code/journey",
      name: "plan-journey",
      component: JourneyView
    },
    {
      path: "/plan/new",
      name: "create-plan",
      component: CreatePlanView
    },
    {
      path: "/plan/join",
      name: "join-plan",
      component: JoinPlanView
    },
    {
      path: "/centres",
      name: "centres",
      component: CentresView
    },
    {
      path: "/centre-search",   
      name: "centre-search",
      component: CentreSearch
    },
    {
      path: "/centres/:id",
      name: "centre-detail",
      component: CentreDetailView
    },
    {
      path: "/hawker/dashboard",
      name: "hawker-dashboard",
      component: HawkerDashboard
    },
    {
      path: "/:pathMatch(.*)*", //// (.*) matches any sequence of char, then * behind allows the match to cover multiple URL segments
      name: "not-found",
      component: NotFoundView
    }
  ]
})

export default router
