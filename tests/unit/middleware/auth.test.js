import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
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

vi.mock('@/api/auth', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateProfile: vi.fn()
  }
}))

const route = (overrides = {}) => ({
  name: 'Dashboard',
  fullPath: '/dashboard',
  path: '/dashboard',
  ...overrides
})

describe('Auth middleware', () => {
  let authStore
  let next

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    authStore.isInitialized = true
    next = vi.fn()
    vi.clearAllMocks()
  })

  describe('requireAuth', () => {
    it('redireciona para login preservando a rota de destino quando não autenticado', async () => {
      await requireAuth(route({ fullPath: '/portfolio?tab=ativos' }), route({ name: 'Home' }), next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/portfolio?tab=ativos' }
      })
    })

    it('permite o acesso quando o usuário está autenticado', async () => {
      authStore.user = { id: 1, email: 'user@test.com' }

      await requireAuth(route(), route(), next)

      expect(next).toHaveBeenCalledWith()
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('inicializa a store antes de decidir o acesso quando ainda não foi inicializada', async () => {
      const { authAPI } = await import('@/api/auth')
      authStore.isInitialized = false
      authAPI.checkAuth.mockResolvedValue({
        data: { success: true, user: { id: 7, email: 'init@test.com' } }
      })

      await requireAuth(route(), route(), next)

      expect(authAPI.checkAuth).toHaveBeenCalledTimes(1)
      expect(authStore.isInitialized).toBe(true)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requireGuest', () => {
    it('redireciona usuário autenticado para o dashboard', async () => {
      authStore.user = { id: 1 }

      await requireGuest(route({ name: 'Login', path: '/login' }), route(), next)

      expect(next).toHaveBeenCalledWith({ name: 'Dashboard' })
    })

    it('permite acesso a login/cadastro quando não autenticado', async () => {
      await requireGuest(route({ name: 'Cadastro', path: '/cadastro' }), route(), next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requirePermission', () => {
    it('bloqueia usuário sem a permissão e envia para Forbidden com o requisito', async () => {
      authStore.user = { id: 1, permissions: ['portfolio:read'] }
      const guard = requirePermission('brokers:connect')

      await guard(route({ name: 'Corretoras' }), route(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'Forbidden',
        params: { requiredPermission: 'brokers:connect' }
      })
    })

    it('trata usuário sem array de permissões como sem acesso', async () => {
      authStore.user = { id: 1 }
      const guard = requirePermission('admin')

      await guard(route(), route(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'Forbidden',
        params: { requiredPermission: 'admin' }
      })
    })

    it('permite o acesso quando a permissão está presente', async () => {
      authStore.user = { id: 1, permissions: ['admin', 'brokers:connect'] }
      const guard = requirePermission('brokers:connect')

      await guard(route(), route(), next)

      expect(next).toHaveBeenCalledWith()
    })

    it('redireciona para login quando não autenticado, sem avaliar permissão', async () => {
      const guard = requirePermission('admin')

      await guard(route({ fullPath: '/admin' }), route(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/admin' }
      })
    })
  })

  describe('requireEmailVerified', () => {
    it('envia usuário autenticado sem email verificado para EmailVerification', async () => {
      authStore.user = { id: 1, emailVerified: false }

      await requireEmailVerified(route({ fullPath: '/analises' }), route(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'EmailVerification',
        query: { redirect: '/analises' }
      })
    })

    it('permite acesso quando emailVerified é true', async () => {
      authStore.user = { id: 1, emailVerified: true }

      await requireEmailVerified(route(), route(), next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requireCompleteProfile', () => {
    it('exige name, email e phone mesmo que o cadastro trate telefone como opcional', async () => {
      authStore.user = { id: 1, name: 'Ana', email: 'ana@test.com' }

      await requireCompleteProfile(route({ fullPath: '/corretoras' }), route(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'ProfileSetup',
        query: { redirect: '/corretoras' }
      })
    })

    it('rejeita campos vazios como perfil incompleto', async () => {
      authStore.user = { id: 1, name: 'Ana', email: 'ana@test.com', phone: '' }

      await requireCompleteProfile(route({ fullPath: '/portfolio' }), route(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'ProfileSetup',
        query: { redirect: '/portfolio' }
      })
    })

    it('permite acesso quando name, email e phone estão preenchidos', async () => {
      authStore.user = {
        id: 1,
        name: 'Ana',
        email: 'ana@test.com',
        phone: '(11) 99999-9999'
      }

      await requireCompleteProfile(route(), route(), next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requireBrokerConnection', () => {
    it('ainda não verifica corretoras e apenas autentica', async () => {
      authStore.user = { id: 1 }

      await requireBrokerConnection(route(), route(), next)

      expect(next).toHaveBeenCalledWith()
    })

    it('bloqueia visitante não autenticado', async () => {
      await requireBrokerConnection(route({ fullPath: '/corretoras' }), route(), next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/corretoras' }
      })
    })
  })

  describe('checkMaintenance', () => {
    it('redireciona para Maintenance quando o modo manutenção está ativo', () => {
      vi.stubEnv('VITE_MAINTENANCE_MODE', 'true')

      checkMaintenance(route({ name: 'Dashboard' }), route(), next)

      expect(next).toHaveBeenCalledWith({ name: 'Maintenance' })
      vi.unstubAllEnvs()
    })

    it('não entra em loop na própria rota de manutenção', () => {
      vi.stubEnv('VITE_MAINTENANCE_MODE', 'true')

      checkMaintenance(route({ name: 'Maintenance', path: '/manutencao' }), route(), next)

      expect(next).toHaveBeenCalledWith()
      vi.unstubAllEnvs()
    })

    it('libera a navegação quando o modo manutenção está desligado', () => {
      vi.stubEnv('VITE_MAINTENANCE_MODE', 'false')

      checkMaintenance(route(), route(), next)

      expect(next).toHaveBeenCalledWith()
      vi.unstubAllEnvs()
    })
  })

  describe('logNavigation', () => {
    it('sempre chama next mesmo em desenvolvimento', () => {
      logNavigation(route({ name: 'Home', path: '/' }), route({ name: 'Login', path: '/login' }), next)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('applyMiddlewares', () => {
    it('encadeia middlewares e só chama next final após todos passarem', async () => {
      const first = vi.fn((to, from, nxt) => nxt())
      const second = vi.fn((to, from, nxt) => nxt())
      const combined = applyMiddlewares([first, second])
      const to = route()
      const from = route({ name: 'Home' })

      await combined(to, from, next)

      expect(first).toHaveBeenCalledTimes(1)
      expect(second).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith()
    })

    it('interrompe a cadeia quando um middleware redireciona', async () => {
      const first = vi.fn((to, from, nxt) => nxt({ name: 'Login' }))
      const second = vi.fn((to, from, nxt) => nxt())
      const combined = applyMiddlewares([first, second])

      await combined(route(), route(), next)

      expect(second).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith({ name: 'Login' })
    })

    it('propaga redirect do segundo middleware após o primeiro autorizar', async () => {
      const first = vi.fn((to, from, nxt) => nxt())
      const second = vi.fn((to, from, nxt) => nxt({ name: 'Forbidden' }))
      const combined = applyMiddlewares([first, second])

      await combined(route(), route(), next)

      expect(first).toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith({ name: 'Forbidden' })
    })
  })
})
