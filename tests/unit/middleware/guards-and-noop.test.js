import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import {
  requireAuth,
  requirePermission,
  requireEmailVerified,
  requireCompleteProfile,
  requireBrokerConnection,
  applyMiddlewares,
  checkMaintenance
} from '@/middleware/auth'

describe('Guards de auth — initialize, no-op e rotas ausentes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('requirePermission não chama initialize — sessão só em sessionStorage é tratada como anônima', async () => {
    const store = useAuthStore()
    const initSpy = vi.spyOn(store, 'initialize')
    const next = vi.fn()

    await requirePermission('admin')({ fullPath: '/admin' }, {}, next)

    expect(initSpy).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/admin' }
    })
  })

  it('requirePermission autenticado sem a permissão vai para Forbidden com params que a rota não declara', async () => {
    const store = useAuthStore()
    store.user = { id: 1, permissions: ['read'] }
    const next = vi.fn()

    await requirePermission('brokers:write')({ fullPath: '/corretoras' }, {}, next)

    expect(next).toHaveBeenCalledWith({
      name: 'Forbidden',
      params: { requiredPermission: 'brokers:write' }
    })
  })

  it('requireBrokerConnection é no-op: autenticado segue mesmo sem corretoras', async () => {
    const store = useAuthStore()
    store.user = { id: 1 }
    const next = vi.fn()

    await requireBrokerConnection({ fullPath: '/portfolio' }, {}, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('requireEmailVerified redireciona para rota EmailVerification que o router não registra', async () => {
    const store = useAuthStore()
    store.user = { id: 1, emailVerified: false }
    const next = vi.fn()

    await requireEmailVerified({ fullPath: '/dashboard' }, {}, next)

    expect(next).toHaveBeenCalledWith({
      name: 'EmailVerification',
      query: { redirect: '/dashboard' }
    })
  })

  it('requireCompleteProfile trata string vazia como incompleto, mas espaço em branco como completo', async () => {
    const store = useAuthStore()
    const next = vi.fn()

    store.user = { name: '', email: 'a@b.com', phone: '1' }
    await requireCompleteProfile({ fullPath: '/x' }, {}, next)
    expect(next).toHaveBeenCalledWith({
      name: 'ProfileSetup',
      query: { redirect: '/x' }
    })

    next.mockClear()
    store.user = { name: '  ', email: 'a@b.com', phone: '1' }
    await requireCompleteProfile({ fullPath: '/x' }, {}, next)
    expect(next).toHaveBeenCalledWith()
  })

  it('applyMiddlewares para no primeiro next com resultado e não executa o restante', async () => {
    const first = vi.fn((to, from, next) => next({ name: 'Login' }))
    const second = vi.fn((to, from, next) => next())
    const terminal = vi.fn()

    await applyMiddlewares([first, second])({ path: '/a' }, {}, terminal)

    expect(first).toHaveBeenCalled()
    expect(second).not.toHaveBeenCalled()
    expect(terminal).toHaveBeenCalledWith({ name: 'Login' })
  })

  it('requireAuth sem sessão guarda redirect na query do Login', async () => {
    const next = vi.fn()
    const store = useAuthStore()
    vi.spyOn(store, 'initialize').mockResolvedValue()

    await requireAuth({ fullPath: '/portfolio?tab=fiis' }, {}, next)

    expect(next).toHaveBeenCalledWith({
      name: 'Login',
      query: { redirect: '/portfolio?tab=fiis' }
    })
  })

  it('checkMaintenance só redireciona quando VITE_MAINTENANCE_MODE é a string "true"', () => {
    const next = vi.fn()
    const env = import.meta.env
    const original = env.VITE_MAINTENANCE_MODE
    const assign = (value) => {
      try {
        env.VITE_MAINTENANCE_MODE = value
        return true
      } catch {
        Object.defineProperty(env, 'VITE_MAINTENANCE_MODE', { value, configurable: true })
        return true
      }
    }

    assign('TRUE')
    checkMaintenance({ name: 'Dashboard' }, {}, next)
    expect(next).toHaveBeenCalledWith()

    next.mockClear()
    assign('true')
    checkMaintenance({ name: 'Dashboard' }, {}, next)
    expect(next).toHaveBeenCalledWith({ name: 'Maintenance' })

    assign(original)
  })
})
