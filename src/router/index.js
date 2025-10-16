import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../components/HomePage.vue'),
    meta: { title: 'Home' }
  },
  {
    path: '/colors',
    name: 'colors',
    component: () => import('../components/ColorPage.vue'),
    meta: { title: 'Colors' }
  },
  {
    path: '/palette',
    name: 'palette',
    component: () => import('../components/ColorPalette.vue'),
    meta: { title: 'Palette' }
  },
  {
    path: '/hue',
    name: 'hue',
    component: () => import('../components/ColorHue.vue'),
    meta: { title: 'Hue' }
  },
  {
    path: '/explore',
    name: 'explore',
    component: () => import('../components/ExplorePage.vue'),
    meta: { title: 'Explore' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.afterEach((to) => {
  if (to.meta?.title) document.title = `De-Colorize · ${to.meta.title}`
})

export default router