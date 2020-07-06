import Vue from 'vue'
import VueRouter from 'vue-router'
import Instructor from '../views/Instructor.vue'
import Trainee from '../views/Trainee.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/trainee',
    name: 'Trainee',
    component: Trainee
  },
  {
    path: '/trainee/:channelId',
    name: 'Trainee',
    component: Trainee
  },
  {
    path: '/',
    name: 'Instructor',
    component: Instructor
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
