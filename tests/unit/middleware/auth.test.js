import { describe, it, expect, beforeEach, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  isInitialized: true,
  isAuthenticated: false,
  user: null,
  initialize: vi.fn(async () => {
    authState.isInitialized = true
  })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authState
}))

import {
  requireAuth,
  requireGuest,
  requirePermission,
  requireEmailVerified,
  requireCompleteProfile,
  requireBrokerConnection,
  logNavigation,
  checkMaintenance,
  applyMiddlewares
} from '@/middleware/auth'

const createRoute = (overrides = {}) => ({
  name: 'Dashboard',
  fullPath: '/dashboard',
  path: '/dashboard',
  ...overrides
})

describe('Middleware de autenticação e permissões', () => {
  let next

  beforeEach(() => {
    next = vi.fn()
    authState.isInitialized = true
    authState.isAuthenticated = false
    authState.user = null
    authState.initialize.mockClear()
    vi.unstubAllEnvs()
  })

  describe('requireAuth', () => {
    it('inicializa a store quando ainda não foi inicializada', async () => {
      authState.isInitialized = false
      authState.isAuthenticated = true

      await requireAuth(createRoute(), createRoute({ name: 'Home' }), next)

      expect(authState.initialize).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith()
    })

    it('redireciona para login preservando a rota de destino quando não autenticado', async () => {
      const to = createRoute({ name: 'Corretoras', fullPath: '/corretoras?tab=sync' })

      await requireAuth(to, createRoute({ name: 'Home' }), next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/corretoras?tab=sync' }
      })
    })

    it('permite o acesso quando o usuário está autenticado', async () => {
      authState.isAuthenticated = true

      await requireAuth(createRoute(), createRoute({ name: 'Home' }), next)

      expect(next).toHaveBeenCalledWith()
      expect(next).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'Login' }))
    })
  })

  describe('requireGuest', () => {
    it('redireciona usuário autenticado para o dashboard', async () => {
      authState.isAuthenticated = true

      await requireGuest(createRoute({ name: 'Login', fullPath: '/login' }), createRoute(), next)

      expect(next).toHaveBeenCalledWith({ name: 'Dashboard' })
    })

    it('permite acesso a login/cadastro para visitante', async () => {
      await requireGuest(createRoute({ name: 'Login', fullPath: '/login' }), createRoute(), next)

      expect(next).toHaveBeenCalledWith()
    })

    it('inicializa a store antes de decidir o redirecionamento', async () => {
      authState.isInitialized = false

      await requireGuest(createRoute({ name: 'Cadastro' }), createRoute(), next)

      expect(authState.initialize).toHaveBeenCalledTimes(1)
    })
  })

  describe('requirePermission', () => {
    it('bloqueia usuário não autenticado antes de checar permissão', async () => {
      const guard = requirePermission('brokers:manage')

      await guard(createRoute({ fullPath: '/corretoras' }), createRoute(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/corretoras' }
      })
    })

    it('redireciona para Forbidden quando a permissão está ausente', async () => {
      authState.isAuthenticated = true
      authState.user = { permissions: ['portfolio:read'] }
      const guard = requirePermission('brokers:manage')

      await guard(createRoute(), createRoute(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'Forbidden',
        params: { requiredPermission: 'brokers:manage' }
      })
    })

    it('trata usuário sem lista de permissões como sem acesso', async () => {
      authState.isAuthenticated = true
      authState.user = { name: 'João' }
      const guard = requirePermission('analysis:run')

      await guard(createRoute(), createRoute(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'Forbidden',
        params: { requiredPermission: 'analysis:run' }
      })
    })

    it('permite acesso quando o usuário possui a permissão exigida', async () => {
      authState.isAuthenticated = true
      authState.user = { permissions: ['brokers:manage', 'portfolio:read'] }
      const guard = requirePermission('brokers:manage')

      await guard(createRoute(), createRoute(), next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requireEmailVerified', () => {
    it('redireciona para login se não autenticado', async () => {
      await requireEmailVerified(createRoute({ fullPath: '/perfil' }), createRoute(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/perfil' }
      })
    })

    it('redireciona para verificação quando o e-mail não foi confirmado', async () => {
      authState.isAuthenticated = true
      authState.user = { emailVerified: false }

      await requireEmailVerified(createRoute({ fullPath: '/dashboard' }), createRoute(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'EmailVerification',
        query: { redirect: '/dashboard' }
      })
    })

    it('permite acesso com e-mail verificado', async () => {
      authState.isAuthenticated = true
      authState.user = { emailVerified: true }

      await requireEmailVerified(createRoute(), createRoute(), next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requireCompleteProfile', () => {
    it('redireciona para login se não autenticado', async () => {
      await requireCompleteProfile(createRoute({ fullPath: '/metas' }), createRoute(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/metas' }
      })
    })

    it('exige name, email e phone preenchidos', async () => {
      authState.isAuthenticated = true
      authState.user = { name: 'João', email: 'joao@email.com' }

      await requireCompleteProfile(createRoute({ fullPath: '/dashboard' }), createRoute(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'ProfileSetup',
        query: { redirect: '/dashboard' }
      })
    })

    it('considera campo vazio como perfil incompleto', async () => {
      authState.isAuthenticated = true
      authState.user = { name: 'João', email: 'joao@email.com', phone: '' }

      await requireCompleteProfile(createRoute({ fullPath: '/dashboard' }), createRoute(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'ProfileSetup',
        query: { redirect: '/dashboard' }
      })
    })

    it('permite acesso com perfil completo', async () => {
      authState.isAuthenticated = true
      authState.user = { name: 'João', email: 'joao@email.com', phone: '11999999999' }

      await requireCompleteProfile(createRoute(), createRoute(), next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requireBrokerConnection', () => {
    it('bloqueia visitante não autenticado', async () => {
      await requireBrokerConnection(createRoute({ fullPath: '/portfolio' }), createRoute(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/portfolio' }
      })
    })

    it('permite usuário autenticado (checagem de corretora ainda não imposta)', async () => {
      authState.isAuthenticated = true

      await requireBrokerConnection(createRoute(), createRoute(), next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('checkMaintenance', () => {
    it('redireciona para manutenção quando o modo está ativo', () => {
      vi.stubEnv('VITE_MAINTENANCE_MODE', 'true')

      checkMaintenance(createRoute({ name: 'Dashboard' }), createRoute(), next)

      expect(next).toHaveBeenCalledWith({ name: 'Maintenance' })
    })

    it('não redireciona se a rota atual já é Maintenance', () => {
      vi.stubEnv('VITE_MAINTENANCE_MODE', 'true')

      checkMaintenance(createRoute({ name: 'Maintenance' }), createRoute(), next)

      expect(next).toHaveBeenCalledWith()
    })

    it('não intercepta navegação quando manutenção está desligada', () => {
      vi.stubEnv('VITE_MAINTENANCE_MODE', 'false')

      checkMaintenance(createRoute({ name: 'Dashboard' }), createRoute(), next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('logNavigation', () => {
    it('sempre chama next para não bloquear a navegação', () => {
      logNavigation(createRoute({ name: 'Home' }), createRoute({ name: 'Login' }), next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('applyMiddlewares', () => {
    it('executa middlewares em sequência e chama next ao final', async () => {
      const first = vi.fn((to, from, nxt) => nxt())
      const second = vi.fn((to, from, nxt) => nxt())
      const combined = applyMiddlewares([first, second])
      const to = createRoute()
      const from = createRoute({ name: 'Home' })

      await combined(to, from, next)

      expect(first).toHaveBeenCalledTimes(1)
      expect(second).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith()
    })

    it('interrompe a cadeia quando um middleware redireciona', async () => {
      const blocking = vi.fn((to, from, nxt) => nxt({ name: 'Login' }))
      const neverCalled = vi.fn((to, from, nxt) => nxt())
      const combined = applyMiddlewares([blocking, neverCalled])

      await combined(createRoute(), createRoute(), next)

      expect(blocking).toHaveBeenCalledTimes(1)
      expect(neverCalled).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith({ name: 'Login' })
    })

    it('chama next imediatamente quando a lista está vazia', async () => {
      const combined = applyMiddlewares([])

      await combined(createRoute(), createRoute(), next)

      expect(next).toHaveBeenCalledWith()
    })
  })
})
