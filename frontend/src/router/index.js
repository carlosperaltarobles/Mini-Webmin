/**
 * Configuración del router de Vue
 */

import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/users'
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/UsersView.vue'),
    meta: {
      title: 'Usuarios',
      icon: 'mdi-account-group'
    }
  },
  {
    path: '/groups',
    name: 'Groups',
    component: () => import('../views/GroupsView.vue'),
    meta: {
      title: 'Grupos',
      icon: 'mdi-account-multiple'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Actualizar título de la página
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'Inicio'} - La Chanchona`
  next()
})

export default router
