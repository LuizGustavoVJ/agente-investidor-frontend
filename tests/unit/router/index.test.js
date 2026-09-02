import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { requireAuth, requireGuest } from '@/middleware/auth'

const routerSource = readFileSync(resolve(__dirname, '../../../src/router/index.js'), 'utf8')

const Dummy = { template: '<div />' }

describe('Router (fonte de produção)', () => {
  it('protege as rotas autenticadas com requireAuth', () => {
    const protectedNames = [
      'Dashboard',
      'Portfolio',
      'Analises',
      'Metodologias',
      'Corretoras',
      'Relatorios',
      'Configuracoes',
      'Perfil'
    ]

    for (const name of protectedNames) {
      const block = routerSource.split(`name: '${name}'`)[1]?.slice(0, 400)
      expect(block, `bloco da rota ${name}`).toBeTruthy()
      expect(block).toContain('beforeEnter: requireAuth')
      expect(block).toContain('requiresAuth: true')
    }
  })

  it('aplica requireGuest em login e cadastro', () => {
    for (const name of ['Login', 'Cadastro']) {
      const block = routerSource.split(`name: '${name}'`)[1]?.slice(0, 400)
      expect(block).toContain('beforeEnter: requireGuest')
      expect(block).toContain('public: true')
    }
  })

  it('registra manutenção, título da página e fallback de erro de chunk', () => {
    expect(routerSource).toContain('router.beforeEach(checkMaintenance)')
    expect(routerSource).toContain('router.beforeEach(logNavigation)')
    expect(routerSource).toContain('document.title = to.meta.title')
    expect(routerSource).toContain('return savedPosition')
    expect(routerSource).toContain('return { top: 0 }')
    expect(routerSource).toContain("error.name === 'ChunkLoadError'")
    expect(routerSource).toContain('window.location.reload()')
    expect(routerSource).toContain("router.push('/500')")
  })
})

describe('Router (guards com vue-router)', () => {
  let router
  let authStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    authStore.isInitialized = true
    authStore.user = null

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'Home', component: Dummy, meta: { title: 'Home', public: true } },
        {
          path: '/login',
          name: 'Login',
          component: Dummy,
          beforeEnter: requireGuest,
          meta: { title: 'Login', public: true }
        },
        {
          path: '/dashboard',
          name: 'Dashboard',
          component: Dummy,
          beforeEnter: requireAuth,
          meta: { title: 'Dashboard - Agente Investidor', requiresAuth: true }
        },
        { path: '/500', name: 'Error500', component: Dummy, meta: { public: true } }
      ],
      scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
          return savedPosition
        }
        return { top: 0 }
      }
    })

    router.afterEach((to) => {
      if (to.meta.title) {
        document.title = to.meta.title
      }
    })

    await router.push('/')
    await router.isReady()
  })

  it('restaura posição salva no scroll e vai ao topo no restante', () => {
    const { scrollBehavior } = router.options
    expect(scrollBehavior({}, {}, { left: 10, top: 80 })).toEqual({ left: 10, top: 80 })
    expect(scrollBehavior({}, {}, null)).toEqual({ top: 0 })
  })

  it('atualiza document.title após navegação', async () => {
    await router.push({ name: 'Home' })
    expect(document.title).toBe('Home')
  })

  it('redireciona rota autenticada para Login com redirect quando não há sessão', async () => {
    await router.push({ name: 'Dashboard' })

    expect(router.currentRoute.value.name).toBe('Login')
    expect(router.currentRoute.value.query.redirect).toBe('/dashboard')
  })

  it('impede visitante autenticado de abrir login', async () => {
    authStore.user = { id: 1, email: 'user@test.com' }

    await router.push({ name: 'Login' })

    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('permite acesso ao dashboard quando autenticado', async () => {
    authStore.user = { id: 1, email: 'user@test.com' }

    await router.push({ name: 'Dashboard' })

    expect(router.currentRoute.value.name).toBe('Dashboard')
  })
})
