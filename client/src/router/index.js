import {
  createRouter,
  createWebHistory
} from "vue-router"

import HomeView from "../views/HomeView.vue"

const router = createRouter({
  history: createWebHistory(
    import.meta.env.BASE_URL
  ),

  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView
    },

    {
      path: "/plan/:code/lobby", 
      name: "plan-lobby", 
      component: () => import("../views/PlanLobby.vue")
      },
    {
      path: "/plan/:code/swipe", 
      name: "plan-swipe", 
      component: () => import("../views/SwipeLobby.vue")
      },
    {
      path: "/plan/new",
      name: "create-plan",
      component: () => import("../views/CreatePlanView.vue")
    },

    {
      path: "/plan/join",
      name: "join-plan",
      component: () => import("../views/JoinPlanView.vue")
    },

    {
      path: "/centres",
      name: "centres",
      component: () => import("../views/CentresView.vue")
    },
    {
      path: "/centres/:id",
      name: "centre-detail",
      component: () => import("../views/CentreDetailView.vue")
    }
  ]
})

export default router