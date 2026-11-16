import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const initialize = vi.fn()
const authState = {
  isInitialized: false,
  isAuthenticated: false,
  user: null,
  initialize
}

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
  checkMaintenance,
  applyMiddlewares,
  logNavigation
} from '@/middleware/auth'

const createNext = () => vi.fn()

describe('Auth middleware', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    authState.isInitialized = false
    authState.isAuthenticated = false
    authState.user = null
    initialize.mockResolvedValue(undefined)
  })

  describe('requireAuth', () => {
    it('inicializa a store quando ainda não foi hidratada e redireciona para login com a rota original', async () => {
      const next = createNext()
      const to = { fullPath: '/dashboard?tab=risco', name: 'Dashboard' }

      await requireAuth(to, {}, next)

      expect(initialize).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/dashboard?tab=risco' }
      })
    })

    it('não chama initialize de novo se a sessão já foi verificada', async () => {
      authState.isInitialized = true
      authState.isAuthenticated = true
      const next = createNext()

      await requireAuth({ fullPath: '/portfolio' }, {}, next)

      expect(initialize).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requireGuest', () => {
    it('envia usuário já autenticado para o Dashboard', async () => {
      authState.isInitialized = true
      authState.isAuthenticated = true
      const next = createNext()

      await requireGuest({ name: 'Login' }, {}, next)

      expect(next).toHaveBeenCalledWith({ name: 'Dashboard' })
    })

    it('permite acesso anônimo às rotas de login e cadastro', async () => {
      authState.isInitialized = true
      const next = createNext()

      await requireGuest({ name: 'Cadastro' }, {}, next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requirePermission', () => {
    it('bloqueia visitante sem sessão antes de checar a permissão', async () => {
      const next = createNext()
      const guard = requirePermission('brokers:write')

      await guard({ fullPath: '/corretoras' }, {}, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/corretoras' }
      })
    })

    it('trata usuário sem array de permissões como não autorizado', async () => {
      authState.isAuthenticated = true
      authState.user = { id: 1, name: 'Ana' }
      const next = createNext()

      await requirePermission('portfolio:manage')({ fullPath: '/portfolio' }, {}, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Forbidden',
        params: { requiredPermission: 'portfolio:manage' }
      })
    })

    it('é case-sensitive e não aceita permissão com casing diferente', async () => {
      authState.isAuthenticated = true
      authState.user = { permissions: ['PORTFOLIO:MANAGE'] }
      const next = createNext()

      await requirePermission('portfolio:manage')({ fullPath: '/portfolio' }, {}, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Forbidden',
        params: { requiredPermission: 'portfolio:manage' }
      })
    })

    it('libera navegação quando a permissão exata está presente', async () => {
      authState.isAuthenticated = true
      authState.user = { permissions: ['portfolio:manage', 'brokers:read'] }
      const next = createNext()

      await requirePermission('portfolio:manage')({ fullPath: '/portfolio' }, {}, next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requireEmailVerified', () => {
    it('redireciona para verificação quando emailVerified é false', async () => {
      authState.isAuthenticated = true
      authState.user = { email: 'ana@ex.com', emailVerified: false }
      const next = createNext()

      await requireEmailVerified({ fullPath: '/configuracoes' }, {}, next)

      expect(next).toHaveBeenCalledWith({
        name: 'EmailVerification',
        query: { redirect: '/configuracoes' }
      })
    })

    it('aceita emailVerified como string "true" porque o valor é truthy', async () => {
      authState.isAuthenticated = true
      authState.user = { emailVerified: 'true' }
      const next = createNext()

      await requireEmailVerified({ fullPath: '/dashboard' }, {}, next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requireCompleteProfile', () => {
    it('exige name, email e phone e trata string vazia como campo ausente', async () => {
      authState.isAuthenticated = true
      authState.user = { name: 'Ana', email: 'ana@ex.com', phone: '' }
      const next = createNext()

      await requireCompleteProfile({ fullPath: '/analises' }, {}, next)

      expect(next).toHaveBeenCalledWith({
        name: 'ProfileSetup',
        query: { redirect: '/analises' }
      })
    })

    it('aceita telefone só com espaços porque o valor é truthy', async () => {
      authState.isAuthenticated = true
      authState.user = { name: 'Ana', email: 'ana@ex.com', phone: '   ' }
      const next = createNext()

      await requireCompleteProfile({ fullPath: '/analises' }, {}, next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('requireBrokerConnection', () => {
    it('não consulta corretoras e libera qualquer usuário autenticado', async () => {
      authState.isAuthenticated = true
      const next = createNext()

      await requireBrokerConnection({ fullPath: '/corretoras' }, {}, next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('checkMaintenance', () => {
    it('segue o fluxo quando o modo manutenção não está ativo', () => {
      const next = createNext()

      checkMaintenance({ name: 'Dashboard' }, {}, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('redireciona para Maintenance quando VITE_MAINTENANCE_MODE é a string true', () => {
      vi.stubEnv('VITE_MAINTENANCE_MODE', 'true')
      const next = createNext()

      checkMaintenance({ name: 'Dashboard' }, {}, next)

      expect(next).toHaveBeenCalledWith({ name: 'Maintenance' })
      vi.unstubAllEnvs()
    })

    it('não entra em loop se a rota atual já é Maintenance', () => {
      vi.stubEnv('VITE_MAINTENANCE_MODE', 'true')
      const next = createNext()

      checkMaintenance({ name: 'Maintenance' }, {}, next)

      expect(next).toHaveBeenCalledWith()
      vi.unstubAllEnvs()
    })
  })

  describe('applyMiddlewares', () => {
    it('encadeia middlewares e aborta o restante no primeiro redirect', async () => {
      const later = vi.fn()
      const combined = applyMiddlewares([
        (to, from, next) => next({ name: 'Login' }),
        later
      ])
      const next = createNext()

      await combined({ fullPath: '/dashboard' }, {}, next)

      expect(next).toHaveBeenCalledWith({ name: 'Login' })
      expect(later).not.toHaveBeenCalled()
    })

    it('chama next final só depois de todos os middlewares passarem', async () => {
      const order = []
      const combined = applyMiddlewares([
        (to, from, next) => {
          order.push('a')
          next()
        },
        (to, from, next) => {
          order.push('b')
          next()
        }
      ])
      const next = createNext()

      await combined({ path: '/x' }, {}, next)

      expect(order).toEqual(['a', 'b'])
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('logNavigation', () => {
    it('não bloqueia a navegação', () => {
      const next = createNext()

      logNavigation({ name: 'Home', path: '/' }, { name: 'Login', path: '/login' }, next)

      expect(next).toHaveBeenCalledWith()
    })
  })
})
