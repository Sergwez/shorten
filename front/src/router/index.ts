import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import InfoPage from '../pages/InfoPage.vue'
import AnalyticsPage from '../pages/AnalyticsPage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/info/:shortUrl',
    name: 'Info',
    component: InfoPage,
    props: true
  },
  {
    path: '/analytics/:shortUrl',
    name: 'Analytics',
    component: AnalyticsPage,
    props: true
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFoundPage,
    props: true
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

export default router 