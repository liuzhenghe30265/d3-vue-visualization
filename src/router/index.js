import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/map',
    name: 'map',
    component: () => import('../pages/map.vue')
  },
  {
    path: '/',
    name: 'visualization',
    component: () => import('../pages/visualization.vue')
  }
]

const router = new VueRouter({
  // mode: 'history',
  // base: process.env.BASE_URL,
  routes
})

export default router