import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import {
  requireAuth,
  requireGuest,
  requirePermission,
  requireEmailVerified,
  requireCompleteProfile,
  requireBrokerConnection,
  applyMiddlewares,
  checkMaintenance,
  logNavigation
} from '@/middleware/auth'

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn()
}))

const createRoute = (overrides = {}) => ({
  name: 'Dashboard',
  fullPath: '/dashboard',
  path: '/dashboard',
  ...overrides
})

describe('Middleware de autenticação e permissões', () => {
  let authStore
  let next

  beforeEach(() => {
    next = vi.fn()
    authStore = {
      isInitialized: true,
      isAuthenticated: false,
      user: null,
      initialize: vi.fn().mockResolvedValue(true)
    }
    useAuthStore.mockReturnValue(authStore)
  })

  describe('requireAuth', () => {
    it('redireciona para Login com a rota de destino quando não autenticado', async () => {
      const to = createRoute({ fullPath: '/portfolio?tab=ativos' })

      await requireAuth(to, {}, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/portfolio?tab=ativos' }
      })
    })

    it('permite acesso quando o usuário está autenticado', async () => {
      authStore.isAuthenticated = true

      await requireAuth(createRoute(), {}, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('inicializa a store antes de decidir quando ainda não foi inicializada', async () => {
      authStore.isInitialized = false
      authStore.initialize.mockImplementation(async () => {
        authStore.isAuthenticated = true
      })

      await requireAuth(createRoute(), {}, next)

      expect(authStore.initialize).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requireGuest', () => {
    it('redireciona usuário autenticado para o Dashboard', async () => {
      authStore.isAuthenticated = true

      await requireGuest(createRoute({ name: 'Login', fullPath: '/login' }), {}, next)

      expect(next).toHaveBeenCalledWith({ name: 'Dashboard' })
    })

    it('permite acesso a login/cadastro quando não autenticado', async () => {
      await requireGuest(createRoute({ name: 'Login', fullPath: '/login' }), {}, next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requirePermission', () => {
    it('bloqueia usuário sem a permissão exigida', async () => {
      authStore.isAuthenticated = true
      authStore.user = { permissions: ['portfolio.read'] }

      await requirePermission('brokers.manage')(createRoute(), {}, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Forbidden',
        params: { requiredPermission: 'brokers.manage' }
      })
    })

    it('permite acesso quando o usuário possui a permissão', async () => {
      authStore.isAuthenticated = true
      authStore.user = { permissions: ['brokers.manage', 'portfolio.read'] }

      await requirePermission('brokers.manage')(createRoute(), {}, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('trata ausência de permissions como lista vazia', async () => {
      authStore.isAuthenticated = true
      authStore.user = { name: 'João' }

      await requirePermission('admin')(createRoute(), {}, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Forbidden',
        params: { requiredPermission: 'admin' }
      })
    })

    it('exige autenticação antes de verificar permissão', async () => {
      await requirePermission('admin')(createRoute({ fullPath: '/admin' }), {}, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/admin' }
      })
    })

    it('não inicializa a store — permissões stale passam se isAuthenticated já for true', async () => {
      authStore.isInitialized = false
      authStore.isAuthenticated = true
      authStore.user = { permissions: ['brokers.manage'] }

      await requirePermission('brokers.manage')(createRoute(), {}, next)

      expect(authStore.initialize).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requireEmailVerified', () => {
    it('redireciona para verificação quando o email não foi confirmado', async () => {
      authStore.isAuthenticated = true
      authStore.user = { emailVerified: false }

      await requireEmailVerified(createRoute({ fullPath: '/analises' }), {}, next)

      expect(next).toHaveBeenCalledWith({
        name: 'EmailVerification',
        query: { redirect: '/analises' }
      })
    })

    it('permite acesso com email verificado', async () => {
      authStore.isAuthenticated = true
      authStore.user = { emailVerified: true }

      await requireEmailVerified(createRoute(), {}, next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requireCompleteProfile', () => {
    it('redireciona para setup quando faltam campos obrigatórios', async () => {
      authStore.isAuthenticated = true
      authStore.user = { name: 'João', email: 'joao@email.com' }

      await requireCompleteProfile(createRoute({ fullPath: '/corretoras' }), {}, next)

      expect(next).toHaveBeenCalledWith({
        name: 'ProfileSetup',
        query: { redirect: '/corretoras' }
      })
    })

    it('permite acesso com perfil completo', async () => {
      authStore.isAuthenticated = true
      authStore.user = { name: 'João', email: 'joao@email.com', phone: '11999999999' }

      await requireCompleteProfile(createRoute(), {}, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('trata campos vazios como perfil incompleto', async () => {
      authStore.isAuthenticated = true
      authStore.user = { name: 'João', email: 'joao@email.com', phone: '' }

      await requireCompleteProfile(createRoute({ fullPath: '/perfil' }), {}, next)

      expect(next).toHaveBeenCalledWith({
        name: 'ProfileSetup',
        query: { redirect: '/perfil' }
      })
    })
  })

  describe('requireBrokerConnection', () => {
    it('exige autenticação antes de verificar corretoras', async () => {
      await requireBrokerConnection(createRoute({ fullPath: '/sync' }), {}, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/sync' }
      })
    })

    it('permite navegação quando autenticado', async () => {
      authStore.isAuthenticated = true

      await requireBrokerConnection(createRoute(), {}, next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('applyMiddlewares', () => {
    it('encadeia middlewares e chama next ao final', async () => {
      const first = vi.fn(async (_to, _from, nxt) => nxt())
      const second = vi.fn(async (_to, _from, nxt) => nxt())
      const combined = applyMiddlewares([first, second])
      const to = createRoute()

      await combined(to, {}, next)
      await vi.waitFor(() => expect(next).toHaveBeenCalledWith())

      expect(first).toHaveBeenCalled()
      expect(second).toHaveBeenCalled()
    })

    it('interrompe a cadeia quando um middleware redireciona', async () => {
      const blocking = vi.fn(async (_to, _from, nxt) => nxt({ name: 'Login' }))
      const skipped = vi.fn()
      const combined = applyMiddlewares([blocking, skipped])

      await combined(createRoute(), {}, next)
      await vi.waitFor(() => expect(next).toHaveBeenCalledWith({ name: 'Login' }))

      expect(skipped).not.toHaveBeenCalled()
    })
  })

  describe('checkMaintenance', () => {
    it('permite navegação quando o modo manutenção está desligado', () => {
      checkMaintenance(createRoute(), {}, next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('logNavigation', () => {
    it('sempre chama next para não bloquear a navegação', () => {
      logNavigation(createRoute(), createRoute({ name: 'Home', path: '/' }), next)

      expect(next).toHaveBeenCalledWith()
    })
  })
})
